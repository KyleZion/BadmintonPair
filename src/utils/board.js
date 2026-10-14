/**
 * 場地（上場區 / 等待區）的資料操作。不依賴 Vue，可以單獨測試。
 *
 * 資料模型
 *   board.live[c] / board.wait[c] 是 4 格陣列 [A1, A2, B1, B2]，值為球員 id 或 null。
 *   休息區不另外存：「不在任何場地上的球員」就是休息區。
 *
 * 選取狀態 Selection
 *   { zone: 'rest', id }                休息區的某位球員
 *   { zone: 'live' | 'wait', c, s }     某個場地的某一格
 *
 * 這裡的函式會直接修改傳入的 board（store 傳進來的是 reactive 物件），
 * 回傳值只用來告訴呼叫端發生了什麼事。
 *
 * @typedef {(string | null)[]} Court
 * @typedef {{ live: Court[], wait: Court[] }} Board
 * @typedef {{ zone: 'rest', id: string } | { zone: 'live' | 'wait', c: number, s: number }} Selection
 */

export const MAX_COURTS = 8;
export const ZONES = ["live", "wait"];

export const emptyCourt = () => [null, null, null, null];

/** 調整場地數：保留原本的場地，多的補空場地，少的直接捨棄（上面的人自然回到休息區） */
export const resizeCourts = (courts, n) =>
  Array.from({ length: n }, (_, i) => (courts[i] ? courts[i].slice(0, 4) : emptyCourt()));

export const countFilled = (courts) => courts.reduce((n, c) => n + c.filter(Boolean).length, 0);
export const isEmptyCourt = (court) => court.every((x) => !x);

/** 每位球員目前的位置標籤：{ [id]: '場地 1' | '等待 2' } */
export function locatePlayers(board) {
  const where = {};
  board.live.forEach((c, i) => c.forEach((id) => id && (where[id] = "場地 " + (i + 1))));
  board.wait.forEach((c, i) => c.forEach((id) => id && (where[id] = "等待 " + (i + 1))));
  return where;
}

/** 選取的是誰（球員 id） */
export function selectedId(board, sel) {
  if (!sel) return null;
  return sel.zone === "rest" ? sel.id : board[sel.zone][sel.c][sel.s];
}

const sameSlot = (a, zone, c, s) => a && a.zone === zone && a.c === c && a.s === s;

/**
 * 點了某個格子。回傳新的選取狀態（null 代表清除選取）與發生的動作。
 *   沒有選取：點有人的格子 → 選取它；點空格 → 'need-select'
 *   已選休息區球員：放進這格（原本的人回休息區）
 *   已選某格：同一格 → 取消；其他格 → 兩格互換
 * @returns {{ sel: Selection | null, action: 'select' | 'need-select' | 'place' | 'swap' | 'cancel' }}
 */
export function tapSlot(board, sel, zone, c, s) {
  const cur = board[zone][c][s];
  if (!sel) {
    return cur ? { sel: { zone, c, s }, action: "select" } : { sel: null, action: "need-select" };
  }
  if (sel.zone === "rest") {
    board[zone][c][s] = sel.id;
    return { sel: null, action: "place" };
  }
  if (sameSlot(sel, zone, c, s)) return { sel: null, action: "cancel" };
  const moving = board[sel.zone][sel.c][sel.s];
  board[sel.zone][sel.c][sel.s] = cur;
  board[zone][c][s] = moving;
  return { sel: null, action: "swap" };
}

/**
 * 點了休息區的球員。
 *   已選某格：這位補進那一格，原本的人回休息區
 *   已選同一位：取消；其他情況：選取這位
 */
export function tapRest(board, sel, id) {
  if (sel && sel.zone !== "rest") {
    board[sel.zone][sel.c][sel.s] = id;
    return { sel: null, action: "place" };
  }
  if (sel && sel.id === id) return { sel: null, action: "cancel" };
  return { sel: { zone: "rest", id }, action: "select" };
}

/** 把選取的格子清空（人回到休息區） */
export function sendToRest(board, sel) {
  if (!sel || sel.zone === "rest") return false;
  board[sel.zone][sel.c][sel.s] = null;
  return true;
}

/** 依序找第一個空位（先上場區再等待區）放入 id；找不到回傳 null */
export function placeInNextEmpty(board, id) {
  for (const z of ZONES) {
    for (let c = 0; c < board[z].length; c++) {
      const s = board[z][c].indexOf(null);
      if (s !== -1) {
        board[z][c][s] = id;
        return { zone: z, c, s };
      }
    }
  }
  return null;
}

/**
 * 等待區第 c 組整組上場：優先上對應的場地 c（手機看板上同一列），
 * 場地 c 有人時改上第一個空的場地。回傳目標場地 index，沒有空場地回傳 -1。
 */
export function promoteWaiting(board, c) {
  const target = board.live[c] && isEmptyCourt(board.live[c]) ? c : board.live.findIndex(isEmptyCourt);
  if (target === -1) return -1;
  board.live[target] = board.wait[c].slice();
  board.wait[c] = emptyCourt();
  return target;
}

/** 把某位球員從所有場地拿掉（刪除球員時用） */
export function removeFromCourts(board, id) {
  ZONES.forEach((z) =>
    board[z].forEach((court) =>
      court.forEach((x, i) => {
        if (x === id) court[i] = null;
      })
    )
  );
}

/** 讀回存檔時清掉不存在的球員 id，並修正場地數 */
export function sanitizeCourts(courts, validIds, n) {
  const clean = (Array.isArray(courts) ? courts : []).map((court) =>
    [0, 1, 2, 3].map((i) => (court && validIds.has(court[i]) ? court[i] : null))
  );
  return resizeCourts(clean, n);
}

/**
 * 檢查能不能把剛結束的 4 個人放回場地 c（復原上一次結束用）：
 *   'ok'          可以復原
 *   'no-court'    場地已經被移除（場地數變少了）
 *   'court-busy'  場地 c 已經排了其他人
 *   'player-busy' 這 4 人當中有人已經被排到其他場地或等待區
 */
export function canRestoreCourt(board, c, ids) {
  if (!board.live[c]) return "no-court";
  if (!isEmptyCourt(board.live[c])) return "court-busy";
  const where = locatePlayers(board);
  if (ids.some((id) => where[id])) return "player-busy";
  return "ok";
}

/**
 * 開始新的一天：所有人的已打場次歸零、清除比賽紀錄、所有人放回休息區（計時也會跟著清除）。
 * 名單與場地數保留。直接修改 state，回傳清掉了什麼，給提示訊息用。
 * @param {{ players: {games: number}[], matches: any[], live: Court[], wait: Court[], courtCount: number }} state
 */
export function clearDay(state) {
  const summary = {
    matches: state.matches.length,
    onCourts: countFilled(state.live) + countFilled(state.wait),
  };
  state.players.forEach((p) => (p.games = 0));
  state.matches = [];
  state.live = resizeCourts([], state.courtCount);
  state.wait = resizeCourts([], state.courtCount);
  return summary;
}

/** 今天是否已經有資料（場次、紀錄或場上有人），沒有就不需要「開始新的一天」 */
export const hasDayData = (state) =>
  state.matches.length > 0 || state.players.some((p) => p.games > 0) || countFilled(state.live) + countFilled(state.wait) > 0;
