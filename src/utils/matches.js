/**
 * 已結束的比賽紀錄（純函式，不依賴 Vue）
 *
 * @typedef {{ id: string, name: string, gender: 'M' | 'F' }} MatchPlayer
 *   比賽當時的球員快照：之後就算從名單刪除或改了性別，舊紀錄也不受影響
 * @typedef {{
 *   id: string,
 *   court: number,            場地編號（從 1 開始）
 *   players: MatchPlayer[],   [A1, A2, B1, B2]
 *   startedAt: number,        開打時間（毫秒時間戳）
 *   endedAt: number,          按下結束的時間
 *   duration: number          比賽時間（毫秒）
 * }} Match
 */

/** 最多保留的紀錄數，避免瀏覽器儲存空間被塞滿（約可記錄好幾個月的球局） */
export const MAX_MATCHES = 500;

/**
 * 依場地目前狀態建立一筆比賽紀錄。場地沒排滿或沒在計時就回傳 null（不算一場）。
 * @param {(string|null)[]} court
 * @param {number} courtIndex 從 0 開始
 * @param {Record<string, {name: string, gender: 'M'|'F'}>} byId
 * @param {number|null} startedAt
 * @param {number} endedAt
 * @returns {Match | null}
 */
export function makeMatch(court, courtIndex, byId, startedAt, endedAt) {
  if (!Array.isArray(court) || court.length !== 4 || typeof startedAt !== "number") return null;
  const players = court.map((id) => (id && byId[id] ? { id, name: byId[id].name, gender: byId[id].gender } : null));
  if (players.some((p) => !p)) return null;
  return {
    id: "m" + endedAt.toString(36) + Math.random().toString(36).slice(2, 6),
    court: courtIndex + 1,
    players,
    startedAt,
    endedAt,
    duration: Math.max(0, endedAt - startedAt),
  };
}

/** 新紀錄放最前面（最新的在上），超過上限就丟掉最舊的。直接修改 list。 */
export function addMatch(list, match) {
  if (!match) return list;
  list.unshift(match);
  if (list.length > MAX_MATCHES) list.length = MAX_MATCHES;
  return list;
}

/** 兩人一隊的類型（依比賽當時的性別快照）：男雙 / 女雙 / 混雙 */
export function pairType(pair) {
  const men = pair.filter((p) => p.gender === "M").length;
  return men === 2 ? "男雙" : men === 0 ? "女雙" : "混雙";
}

/** 統計摘要：場數、總時間、平均時間（毫秒） */
export function summarize(list) {
  const total = list.reduce((s, m) => s + (m.duration || 0), 0);
  return { count: list.length, totalMs: total, avgMs: list.length ? Math.round(total / list.length) : 0 };
}

/**
 * 結束時刻的顯示文字：今天的只顯示 "19:32"，其他日期顯示 "10/11 19:32"
 * @param {number} ts
 * @param {number} [now]
 */
export function formatEndTime(ts, now = Date.now()) {
  const d = new Date(ts);
  const n = new Date(now);
  const hm = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  const sameDay = d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  return sameDay ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}

/** 讀回存檔時檢查格式，壞掉的紀錄直接略過 */
export function sanitizeMatches(arr) {
  if (!Array.isArray(arr)) return [];
  const okPlayer = (p) => p && typeof p.name === "string" && p.name;
  return arr
    .filter((m) => m && Array.isArray(m.players) && m.players.length === 4 && m.players.every(okPlayer) && Number.isFinite(m.endedAt))
    .slice(0, MAX_MATCHES)
    .map((m) => ({
      id: String(m.id || "m" + m.endedAt.toString(36)),
      court: Math.max(1, m.court | 0),
      players: m.players.map((p) => ({ id: String(p.id || ""), name: String(p.name), gender: p.gender === "F" ? "F" : "M" })),
      startedAt: Number.isFinite(m.startedAt) ? m.startedAt : m.endedAt,
      endedAt: m.endedAt,
      duration: Math.max(0, Number(m.duration) || 0),
    }));
}

/** 刪除一筆紀錄，回傳被刪掉的紀錄（找不到回傳 null）。直接修改 list。 */
export function removeMatch(list, id) {
  const i = list.findIndex((m) => m.id === id);
  if (i === -1) return null;
  return list.splice(i, 1)[0];
}
