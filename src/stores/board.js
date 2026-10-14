import { reactive, ref, computed, watch } from "vue";
import { loadState, saveState, defaultState } from "@/utils/storage";
import { makeSample, mergePlayers, parseBulk, parseToken, recordGame, unrecordGame } from "@/utils/players";
import * as B from "@/utils/board";
import { syncTimers, sameTimers, formatElapsed } from "@/utils/timer";
import { makeMatch, addMatch, removeMatch, summarize } from "@/utils/matches";
import { playerStats, playersFromMatches, cumulativeStats } from "@/utils/stats";
import { archiveDay, dayLabel, daySummary, KEEP_DAYS } from "@/utils/days";
import { pairCounts, playerRelations, courtWarnings } from "@/utils/pairs";
import { useToast } from "@/composables/useToast";

/**
 * 全域狀態（單例 store）。
 * 目前不需要 Pinia：用 reactive + 模組層級變數就能讓所有元件共用同一份狀態。
 * 之後功能變多（例如多個 store、devtools 時光回溯）時，可以把這個檔案直接改寫成 Pinia 的 defineStore。
 */
let store = null;

export function useBoard() {
  if (!store) store = createStore();
  return store;
}

function createStore() {
  const { toast } = useToast();

  /* ---------------- 狀態 ---------------- */
  const state = reactive(loadState() || defaultState(makeSample(), 3));
  watch(state, () => saveState(state), { deep: true });

  /* ---------------- 場地計時 ---------------- */
  // 上場場地一排滿就開始計時，沒排滿就清除；所有改動場地的動作都會經過這裡，不用個別處理
  watch(
    () => state.live,
    () => {
      const next = syncTimers(state.live, state.startedAt, Date.now());
      if (!sameTimers(next, state.startedAt || [])) state.startedAt = next;
    },
    { deep: true, immediate: true }
  );
  // 每秒更新一次「現在時間」，畫面上的計時跟著變
  const now = ref(Date.now());
  setInterval(() => (now.value = Date.now()), 1000);
  /** 每面上場場地的計時文字（"分:秒"），沒在計時是空字串 */
  const timerText = computed(() => state.startedAt.map((t) => (t ? formatElapsed(now.value - t) : "")));

  /** UI 狀態（不存檔） */
  const ui = reactive({
    tab: state.started ? "board" : "setup", // 'setup' | 'board' | 'stats'
    sel: null, // Selection，見 utils/board.js
    restCollapsed: false,
    statsTab: "matches", // 統計分頁裡的子分頁：'matches' | 'players'
    /** 統計分頁要看哪一天：'today' | 'history'（過去的日子清單）| 'all'（累計）| 某一天的 id */
    statsView: "today",
    /** 上一次「開始新的一天」之前的狀態，給「復原」用 */
    lastNewDay: null,
    /** 上一次「結束」的內容，給「復原」用：{ c, ids, startedAt, matchId } */
    lastFinish: null,
  });

  /* ---------------- 推導資料 ---------------- */
  const byId = computed(() => Object.fromEntries(state.players.map((p) => [p.id, p])));
  const locate = computed(() => B.locatePlayers(state));
  const rest = computed(() => state.players.filter((p) => !locate.value[p.id]));
  const liveCount = computed(() => B.countFilled(state.live));
  const waitCount = computed(() => B.countFilled(state.wait));
  const hasEmptyLive = computed(() => state.live.some(B.isEmptyCourt));
  const genderCount = computed(() => ({
    M: state.players.filter((p) => p.gender === "M").length,
    F: state.players.filter((p) => p.gender === "F").length,
  }));
  const selKey = computed(() => {
    const s = ui.sel;
    return s && s.zone !== "rest" ? `${s.zone}-${s.c}-${s.s}` : null;
  });
  const selPlayer = computed(() => {
    const id = B.selectedId(state, ui.sel);
    return id ? byId.value[id] || null : null;
  });
  const selFrom = computed(() => {
    const s = ui.sel;
    if (!s) return "";
    return s.zone === "rest" ? "休息區" : (s.zone === "live" ? "場地 " : "等待 ") + (s.c + 1);
  });

  /* ---------------- 搭檔與對手（今天） ---------------- */
  const todayPairs = computed(() => pairCounts(state.matches));
  /**
   * 每面場地／等待組上，今天已經同隊或對打達到門檻（2 次）的組合，key 例如 "live-0"、"wait-2"。
   * 每一組附上兩人的名字，給畫面顯示用。
   */
  const pairWarnings = computed(() => {
    const out = {};
    const name = (id) => (byId.value[id] ? byId.value[id].name : "?");
    const named = (list) => list.map((w) => ({ ...w, names: [name(w.a), name(w.b)] }));
    ["live", "wait"].forEach((z) =>
      state[z].forEach((court, c) => {
        const w = courtWarnings(court, todayPairs.value);
        out[`${z}-${c}`] = { partners: named(w.partners), opponents: named(w.opponents) };
      })
    );
    return out;
  });
  /** 選取中的球員今天的搭檔與對手，給選人時的提示用 */
  const selRelations = computed(() => {
    const p = selPlayer.value;
    return p ? playerRelations(p.id, state.matches, state.players) : null;
  });

  /* ---------------- 名單 ---------------- */
  /** @returns {{ added: number, skipped: string[] }} */
  function addPlayers(items, fallbackGender) {
    const { added, skipped } = mergePlayers(state.players, items, fallbackGender);
    state.players.push(...added);
    if (added.length && state.started) toast(`已新增 ${added.length} 位，放在休息區`);
    return { added: added.length, skipped };
  }
  const addOne = (raw, gender) => addPlayers([parseToken(raw)], gender);
  const addBulk = (text, gender) => addPlayers(parseBulk(text), gender);

  function toggleGender(id) {
    const p = byId.value[id];
    if (p) p.gender = p.gender === "M" ? "F" : "M";
  }
  function removePlayer(id) {
    B.removeFromCourts(state, id);
    state.players = state.players.filter((p) => p.id !== id);
    if (selPlayer.value === null) ui.sel = null;
  }
  function clearCourts() {
    state.live = B.resizeCourts([], state.courtCount);
    state.wait = B.resizeCourts([], state.courtCount);
    ui.sel = null;
  }
  function replaceRoster(players) {
    state.players = players;
    clearCourts();
  }
  /* ---------------- 統計 ---------------- */
  const matchSummary = computed(() => summarize(state.matches));
  /** 球員個人統計（目前名單上的每個人），從比賽紀錄算出來 */
  const stats = computed(() => playerStats(state.players, state.matches, locate.value));
  /** 刪除一筆紀錄，並把那場 4 人的已打場次各 -1 */
  function deleteMatch(id) {
    const m = removeMatch(state.matches, id);
    if (!m) return;
    unrecordGame(byId.value, m.players.map((p) => p.id));
    if (ui.lastFinish && ui.lastFinish.matchId === id) ui.lastFinish = null;
    toast(`已刪除場地 ${m.court} 的紀錄，這 4 人的場次已 -1`);
  }

  /**
   * 開始新的一天：已打場次歸零、清除比賽紀錄、所有人回到休息區；名單與場地數保留。
   * 取代原本分開的「場次歸零」和「清除紀錄」，讓名字後方的場次和統計頁永遠一致。
   */
  const dayHasData = computed(() => B.hasDayData(state));
  function startNewDay() {
    // 先記下目前狀態，給「復原」用
    const before = {
      games: Object.fromEntries(state.players.map((p) => [p.id, p.games || 0])),
      matches: state.matches.slice(),
      live: state.live.map((c) => c.slice()),
      wait: state.wait.map((c) => c.slice()),
      startedAt: state.startedAt.slice(),
      days: JSON.parse(JSON.stringify(state.days)),
    };
    const archived = archiveDay(state.days, state.matches);
    B.clearDay(state);
    ui.lastFinish = null;
    ui.sel = null;
    ui.statsView = "today";
    ui.lastNewDay = before;
    const where = archived ? `今天的 ${archived.addedCount} 場已存到 ${dayLabel(archived.day.date).short}，` : "";
    toast(`新的一天開始了：${where}場次已歸零，所有人都在休息區`, { action: { label: "復原", run: undoNewDay } });
  }
  /** 復原「開始新的一天」：只有在之後還沒打任何一場、場地也還沒排人時可以復原 */
  function undoNewDay() {
    const b = ui.lastNewDay;
    if (!b) return;
    if (state.matches.length || B.countFilled(state.live) + B.countFilled(state.wait) > 0) {
      toast("無法復原：已經開始排人或有新的比賽紀錄");
      return;
    }
    state.players.forEach((p) => (p.games = b.games[p.id] || 0));
    state.days = b.days;
    state.matches = b.matches;
    state.startedAt = b.startedAt; // 先放回開始時間，場地排滿時計時就會接著算
    state.live = b.live;
    state.wait = b.wait;
    ui.lastNewDay = null;
    toast("已復原，今天的紀錄和場次都回來了");
  }

  /* ---------------- 過去的日子 ---------------- */
  /** 每一天加上顯示文字與摘要，最新的在前面 */
  const days = computed(() =>
    state.days.map((d) => ({ ...d, label: dayLabel(d.date), summary: daySummary(d.matches) }))
  );
  const viewedDay = computed(() => days.value.find((d) => d.id === ui.statsView) || null);
  /** 某一天的球員統計（名單上已刪除的人也會列出） */
  const dayStats = computed(() => {
    const d = viewedDay.value;
    return d ? playerStats(playersFromMatches(d.matches), d.matches) : [];
  });
  /** 全部累計：保留中的日子加上今天 */
  const allStats = computed(() =>
    cumulativeStats([{ matches: state.matches }, ...state.days], state.players)
  );
  const allSummary = computed(() => {
    const all = state.matches.concat(...state.days.map((d) => d.matches));
    return { ...daySummary(all), days: state.days.length + (state.matches.length ? 1 : 0) };
  });
  function deleteDay(id) {
    const i = state.days.findIndex((d) => d.id === id);
    if (i === -1) return;
    const [d] = state.days.splice(i, 1);
    ui.statsView = "history";
    toast(`已刪除 ${dayLabel(d.date).short} 的紀錄`);
  }
  const loadSample = () => replaceRoster(makeSample());
  const clearRoster = () => replaceRoster([]);

  /* ---------------- 場地 ---------------- */
  function setCourtCount(n) {
    const next = Math.min(B.MAX_COURTS, Math.max(1, n));
    if (next === state.courtCount) return;
    const dropped = B.countFilled(state.live.slice(next)) + B.countFilled(state.wait.slice(next));
    state.courtCount = next;
    state.live = B.resizeCourts(state.live, next);
    state.wait = B.resizeCourts(state.wait, next);
    ui.sel = null;
    if (dropped) toast(`移除的場地上有 ${dropped} 人，已回到休息區`);
  }
  /** 建立場地：第一次建立時所有人都在休息區 */
  function build() {
    state.live = B.resizeCourts(state.started ? state.live : [], state.courtCount);
    state.wait = B.resizeCourts(state.started ? state.wait : [], state.courtCount);
    state.started = true;
    ui.tab = "board";
    ui.sel = null;
    ui.restCollapsed = false;
  }

  /* ---------------- 排入 / 互換 ---------------- */
  function tapSlot(zone, c, s) {
    const r = B.tapSlot(state, ui.sel, zone, c, s);
    ui.sel = r.sel;
    if (r.action === "need-select") toast("先點休息區的球員，再點這個空位");
  }
  function tapRest(id) {
    ui.sel = B.tapRest(state, ui.sel, id).sel;
  }
  function sendSelectedToRest() {
    if (B.sendToRest(state, ui.sel)) ui.sel = null;
  }
  function placeSelectedNext() {
    if (!ui.sel || ui.sel.zone !== "rest") return;
    if (B.placeInNextEmpty(state, ui.sel.id)) ui.sel = null;
    else toast("上場區和等待區都已經排滿");
  }
  const clearSelection = () => (ui.sel = null);

  /**
   * 結束一場：場地有排滿（正在計時）才算打完一場——場上 4 人的已打場次各 +1，並新增一筆比賽紀錄；
   * 沒排滿就按結束只是把人放回休息區，不記場次也不留紀錄。
   */
  function finishLive(c) {
    const played = timerText.value[c];
    const ids = state.live[c].slice();
    ui.lastFinish = null;
    if (played) {
      const match = makeMatch(ids, c, byId.value, state.startedAt[c], Date.now());
      recordGame(byId.value, ids);
      addMatch(state.matches, match);
      ui.lastFinish = { c, ids, startedAt: state.startedAt[c], matchId: match ? match.id : null };
    }
    state.live[c] = B.emptyCourt(); // 場地清空後計時會自動清除
    ui.sel = null;
    if (played) toast(`場地 ${c + 1} 結束，共打了 ${played}，場次已 +1`, { action: { label: "復原", run: undoFinish } });
    else toast(`場地 ${c + 1} 的球員已回到休息區`);
  }

  /**
   * 復原上一次「結束」：4 人放回原場地、計時從原本的開始時間繼續、刪除那筆紀錄、場次 -1。
   * 場地已經排了別人，或有人已經被排到其他位置時不能復原（避免把人拆散），改用統計頁刪除紀錄。
   */
  function undoFinish() {
    const lf = ui.lastFinish;
    if (!lf) return;
    if (lf.ids.some((id) => !byId.value[id])) {
      toast("無法復原：有球員已從名單刪除");
      return;
    }
    const check = B.canRestoreCourt(state, lf.c, lf.ids);
    if (check !== "ok") {
      const why = {
        "no-court": `場地 ${lf.c + 1} 已被移除`,
        "court-busy": `場地 ${lf.c + 1} 已經排了其他人`,
        "player-busy": "有球員已經被排到其他位置",
      }[check];
      toast(`無法復原：${why}。可以到統計數據刪除那筆紀錄。`, { ms: 4000 });
      return;
    }
    state.startedAt[lf.c] = lf.startedAt; // 先放回開始時間，場地排滿時計時就會接著算
    state.live[lf.c] = lf.ids.slice();
    if (lf.matchId) removeMatch(state.matches, lf.matchId);
    unrecordGame(byId.value, lf.ids);
    ui.lastFinish = null;
    ui.sel = null;
    toast(`已復原場地 ${lf.c + 1}，計時繼續`);
  }
  function promote(c) {
    const target = B.promoteWaiting(state, c);
    ui.sel = null;
    if (target === -1) toast("沒有空的場地，請先按某一場的「結束」");
    else toast(`等待 ${c + 1} 已上場到場地 ${target + 1}`);
  }
  function clearWait(c) {
    state.wait[c] = B.emptyCourt();
    ui.sel = null;
  }
  function resetBoard() {
    clearCourts();
    toast("所有球員都已回到休息區");
  }

  return {
    state,
    ui,
    // 推導
    byId, locate, rest, liveCount, waitCount, hasEmptyLive, genderCount, selKey, selPlayer, selFrom, timerText, now,
    pairWarnings, selRelations,
    // 名單
    addOne, addBulk, toggleGender, removePlayer, loadSample, clearRoster, startNewDay, undoNewDay, dayHasData,
    // 統計
    matchSummary, deleteMatch, stats, days, viewedDay, dayStats, allStats, allSummary, deleteDay, KEEP_DAYS,
    // 場地
    setCourtCount, build,
    // 看板
    tapSlot, tapRest, sendSelectedToRest, placeSelectedNext, clearSelection, finishLive, undoFinish, promote, clearWait, resetBoard,
  };
}
