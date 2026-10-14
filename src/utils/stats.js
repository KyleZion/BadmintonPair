/**
 * 球員個人統計（純函式，不依賴 Vue）：全部從比賽紀錄算出來，不另外存資料。
 *
 * @typedef {{
 *   id: string, name: string, gender: 'M' | 'F',
 *   games: number,            紀錄中的場數
 *   totalMs: number,          總上場時間
 *   avgMs: number,            平均每場時間
 *   lastEndedAt: number|null, 最後一場結束的時間（沒打過是 null）
 *   onCourt: boolean          現在是否在上場區
 * }} PlayerStat
 */

/**
 * @param {{id: string, name: string, gender: 'M'|'F'}[]} players 目前的名單
 * @param {import('./matches.js').Match[]} matches
 * @param {Record<string, string>} locate 球員目前位置（utils/board.js 的 locatePlayers）
 * @returns {PlayerStat[]}
 */
export function playerStats(players, matches, locate = {}) {
  const agg = {};
  matches.forEach((m) => {
    m.players.forEach((p) => {
      if (!p.id) return;
      const a = (agg[p.id] = agg[p.id] || { games: 0, totalMs: 0, lastEndedAt: null });
      a.games++;
      a.totalMs += m.duration || 0;
      if (a.lastEndedAt === null || m.endedAt > a.lastEndedAt) a.lastEndedAt = m.endedAt;
    });
  });
  return players.map((p) => {
    const a = agg[p.id] || { games: 0, totalMs: 0, lastEndedAt: null };
    return {
      id: p.id,
      name: p.name,
      gender: p.gender,
      games: a.games,
      totalMs: a.totalMs,
      avgMs: a.games ? Math.round(a.totalMs / a.games) : 0,
      lastEndedAt: a.lastEndedAt,
      onCourt: String(locate[p.id] || "").startsWith("場地"),
    };
  });
}

/**
 * 休息時間（毫秒）：在場上的人是 -1（排序時放最後），沒打過的人是 Infinity（排最前，最該上場）
 */
export function restMs(row, now) {
  if (row.onCourt) return -1;
  if (row.lastEndedAt === null) return Infinity;
  return Math.max(0, now - row.lastEndedAt);
}

/**
 * 排序：key = 'games' | 'total' | 'avg' | 'rest' | 'name'，dir = 1（小到大）或 -1（大到小）
 * 數值相同時依名字排，結果穩定
 */
export function sortStats(rows, key, dir, now) {
  const val = {
    games: (r) => r.games,
    total: (r) => r.totalMs,
    avg: (r) => r.avgMs,
    rest: (r) => restMs(r, now),
    last: (r) => (r.lastEndedAt === null ? -Infinity : r.lastEndedAt),
    days: (r) => r.days || 0,
    name: () => 0,
  }[key] || ((r) => r.games);
  return rows.slice().sort((a, b) => {
    const va = val(a);
    const vb = val(b);
    if (va !== vb) return va < vb ? -dir : dir;
    return a.name.localeCompare(b.name, "zh-Hant") * (key === "name" ? dir : 1);
  });
}

/**
 * 從比賽紀錄整理出出現過的球員（過去的日子用，名單上已刪除的人也會列出）。
 * 同一個 id 用最新一場的名字與性別。
 */
export function playersFromMatches(matches) {
  const seen = {};
  matches
    .slice()
    .sort((a, b) => b.endedAt - a.endedAt)
    .forEach((m) => m.players.forEach((p) => {
      const id = p.id || "name:" + p.name;
      if (!seen[id]) seen[id] = { id, name: p.name, gender: p.gender };
    }));
  return Object.values(seen);
}

/**
 * 累計統計（「全部」）：多天的比賽紀錄合併計算，另外多一欄「出席天數」。
 * @param {{ matches: import('./matches.js').Match[] }[]} days 每一天（今天也當成一天傳進來）
 * @param {{id: string, name: string, gender: 'M'|'F'}[]} [roster] 目前名單：名字以名單為準，名單上沒打過的人也列出
 */
export function cumulativeStats(days, roster = []) {
  const all = days.flatMap((d) => d.matches);
  const people = {};
  playersFromMatches(all).forEach((p) => (people[p.id] = p));
  roster.forEach((p) => (people[p.id] = { id: p.id, name: p.name, gender: p.gender }));
  const rows = playerStats(Object.values(people), all.map((m) => ({ ...m, players: m.players.map((p) => ({ ...p, id: p.id || "name:" + p.name })) })));
  const attend = {};
  days.forEach((d) => {
    const ids = new Set();
    d.matches.forEach((m) => m.players.forEach((p) => ids.add(p.id || "name:" + p.name)));
    ids.forEach((id) => (attend[id] = (attend[id] || 0) + 1));
  });
  return rows.map((r) => ({ ...r, days: attend[r.id] || 0, onCourt: false }));
}
