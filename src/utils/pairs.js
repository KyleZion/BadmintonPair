/**
 * 搭檔與對手次數（純函式，不依賴 Vue），全部從比賽紀錄算出來。
 *
 *   搭檔：同一隊的兩人，每場 A 隊一組（A1+A2）、B 隊一組（B1+B2）
 *   對手：A 隊每個人對 B 隊每個人，每場 4 組
 *
 * 次數用「兩人的 id 排序後組成的 key」記錄，所以 阿明+小美 和 小美+阿明 是同一組。
 */

/** 配對看板提醒門檻：今天同隊或對打達到這個次數就標示 */
export const PAIR_WARN = 2;

const pid = (p) => p.id || "name:" + p.name;
export const pairKey = (a, b) => (a < b ? a + "|" + b : b + "|" + a);

/**
 * @param {import('./matches.js').Match[]} matches
 * @returns {{ partners: Record<string, number>, opponents: Record<string, number> }}
 */
export function pairCounts(matches) {
  const partners = {};
  const opponents = {};
  const add = (map, a, b) => {
    const k = pairKey(a, b);
    map[k] = (map[k] || 0) + 1;
  };
  matches.forEach((m) => {
    const [a1, a2, b1, b2] = m.players.map(pid);
    add(partners, a1, a2);
    add(partners, b1, b2);
    [a1, a2].forEach((a) => [b1, b2].forEach((b) => add(opponents, a, b)));
  });
  return { partners, opponents };
}

/**
 * 某位球員的搭檔與對手（次數多到少），以及「還沒同隊過」的人。
 * @param {string} id
 * @param {import('./matches.js').Match[]} matches
 * @param {{id: string, name: string}[]} people 這個範圍內的所有人（今天＝名單；某一天＝當天出現的人）
 */
export function playerRelations(id, matches, people) {
  const names = {};
  people.forEach((p) => (names[p.id] = p.name));
  const partners = {};
  const opponents = {};
  matches.forEach((m) => {
    const ids = m.players.map(pid);
    m.players.forEach((p) => (names[pid(p)] = names[pid(p)] || p.name));
    const i = ids.indexOf(id);
    if (i === -1) return;
    const mate = ids[i < 2 ? 1 - i : 5 - i]; // 0↔1、2↔3
    partners[mate] = (partners[mate] || 0) + 1;
    (i < 2 ? ids.slice(2) : ids.slice(0, 2)).forEach((o) => (opponents[o] = (opponents[o] || 0) + 1));
  });
  const list = (map) =>
    Object.entries(map)
      .map(([pid, count]) => ({ id: pid, name: names[pid] || "?", count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-Hant"));
  return {
    partners: list(partners),
    opponents: list(opponents),
    neverPartnered: people.filter((p) => p.id !== id && !partners[p.id]).map((p) => p.name),
  };
}

/**
 * 一面場地（或等待組）上達到門檻的搭檔與對手，給配對看板標示用。
 * @param {(string|null)[]} court [A1, A2, B1, B2]
 * @param {{ partners: Record<string, number>, opponents: Record<string, number> }} counts
 * @returns {{ partners: {a: string, b: string, count: number}[], opponents: {a: string, b: string, count: number}[] }}
 */
export function courtWarnings(court, counts, threshold = PAIR_WARN) {
  const partners = [];
  const opponents = [];
  const check = (list, map, a, b) => {
    if (!a || !b) return;
    const n = map[pairKey(a, b)] || 0;
    if (n >= threshold) list.push({ a, b, count: n });
  };
  const [a1, a2, b1, b2] = court;
  check(partners, counts.partners, a1, a2);
  check(partners, counts.partners, b1, b2);
  [a1, a2].forEach((a) => [b1, b2].forEach((b) => check(opponents, counts.opponents, a, b)));
  const desc = (x, y) => y.count - x.count;
  return { partners: partners.sort(desc), opponents: opponents.sort(desc) };
}
