import { MAX_COURTS, resizeCourts, sanitizeCourts } from "./board.js";
import { syncTimers } from "./timer.js";
import { sanitizeMatches } from "./matches.js";
import { sanitizeDays } from "./days.js";

/**
 * 存檔到 localStorage。版本號放在 key 裡，之後資料格式改變時換 key 即可避免讀到舊格式。
 * 儲存空間可能不可用（無痕模式、被封鎖），所以讀寫都包在 try/catch 裡。
 * startedAt（場地計時）、matches（比賽紀錄）、days（過去的日子）是後來加的欄位，舊存檔沒有它們也能正常讀取。
 */
const STORE_KEY = "badminton-pairing-v1";

export function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!s || !Array.isArray(s.players)) return null;
    const players = s.players
      .filter((p) => p && p.id && p.name)
      .map((p) => ({ id: String(p.id), name: String(p.name), gender: p.gender === "F" ? "F" : "M", games: Math.max(0, p.games | 0) }));
    const ids = new Set(players.map((p) => p.id));
    const courtCount = Math.min(MAX_COURTS, Math.max(1, s.courtCount | 0));
    const live = sanitizeCourts(s.live, ids, courtCount);
    return {
      players,
      courtCount,
      live,
      wait: sanitizeCourts(s.wait, ids, courtCount),
      startedAt: syncTimers(live, s.startedAt, Date.now()),
      matches: sanitizeMatches(s.matches),
      days: sanitizeDays(s.days),
      started: !!s.started,
    };
  } catch (e) {
    return null;
  }
}

export function saveState(state) {
  try {
    const { players, courtCount, live, wait, startedAt, matches, days, started } = state;
    localStorage.setItem(STORE_KEY, JSON.stringify({ players, courtCount, live, wait, startedAt, matches, days, started }));
  } catch (e) {
    /* 儲存空間不可用時忽略 */
  }
}

export function defaultState(players, courtCount = 3) {
  return {
    players,
    courtCount,
    live: resizeCourts([], courtCount),
    wait: resizeCourts([], courtCount),
    startedAt: Array(courtCount).fill(null),
    matches: [],
    days: [],
    started: false,
  };
}
