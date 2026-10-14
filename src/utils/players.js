/**
 * 球員相關的純函式與常數（不依賴 Vue，可以單獨測試）
 *
 * @typedef {'M' | 'F'} Gender
 * @typedef {{ id: string, name: string, gender: Gender, games: number }} Player   games：已打場次
 */

export const NAME_MAX = 16;
export const GENDER_TEXT = { M: "男", F: "女" };

export const uid = () => "p" + Math.random().toString(36).slice(2, 9);

const SAMPLE = [
  ["阿明", "M"], ["小美", "F"], ["大雄", "M"], ["Amy", "F"], ["Ben", "M"],
  ["Cindy", "F"], ["阿凱", "M"], ["小華", "F"], ["志豪", "M"], ["怡君", "F"],
  ["建宏", "M"], ["淑芬", "F"], ["David", "M"], ["Emma", "F"], ["俊傑", "M"],
  ["雅婷", "F"], ["家豪", "M"], ["佩珊", "F"], ["Kevin", "M"], ["Grace", "F"],
];

/** 20 位範例球員（男女各半） */
export const makeSample = () => SAMPLE.map(([name, gender]) => ({ id: uid(), name, gender, games: 0 }));

/**
 * 解析一筆「名字 + 性別」。名字和性別之間必須有分隔字元，避免把「阿男」誤判成性別：
 *   "小明 男"、"小明:女"、"小明(男)"、"Amy F"、"Ben/M" → { name, gender }
 *   沒有標註 → gender: null
 * @param {string} raw
 * @returns {{ name: string, gender: Gender | null }}
 */
export function parseToken(raw) {
  const text = String(raw).trim();
  const m = text.match(/^(.+?)[\s:：(（/／-]+(男|女|M|F)\s*[)）]?$/i);
  if (!m) return { name: text, gender: null };
  return { name: m[1].trim(), gender: /男|m/i.test(m[2]) ? "M" : "F" };
}

/** 把一大段貼上的文字切成多筆（換行、逗號、頓號、分號都可以） */
export function parseBulk(text) {
  return String(text)
    .split(/[\n,，、;；]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseToken);
}

/**
 * 合併新球員到名單：名字重複（不分大小寫）會略過，沒標性別的套用 fallbackGender
 * @param {Player[]} existing
 * @param {{ name: string, gender: Gender | null }[]} items
 * @param {Gender} fallbackGender
 * @returns {{ added: Player[], skipped: string[] }}
 */
export function mergePlayers(existing, items, fallbackGender) {
  const seen = new Set(existing.map((p) => p.name.toLowerCase()));
  const added = [];
  const skipped = [];
  items.forEach(({ name, gender }) => {
    const nm = String(name).trim().slice(0, NAME_MAX);
    if (!nm) return;
    const key = nm.toLowerCase();
    if (seen.has(key)) {
      skipped.push(nm);
      return;
    }
    seen.add(key);
    added.push({ id: uid(), name: nm, gender: gender || fallbackGender, games: 0 });
  });
  return { added, skipped };
}

/**
 * 兩人一隊的類型：男雙 / 女雙 / 混雙；有空位時回傳空字串
 * @param {(string | null)[]} ids
 * @param {Record<string, Player>} byId
 */
export function teamType(ids, byId) {
  if (ids.length !== 2 || ids.some((id) => !id || !byId[id])) return "";
  const men = ids.filter((id) => byId[id].gender === "M").length;
  return men === 2 ? "男雙" : men === 0 ? "女雙" : "混雙";
}

/**
 * 一場打完：場上每位球員的已打場次 +1。直接修改 byId 裡的球員物件。
 * @param {Record<string, Player>} byId
 * @param {(string | null)[]} ids 場地上的球員 id
 * @returns {number} 實際記錄到的人數
 */
export function recordGame(byId, ids) {
  let n = 0;
  ids.forEach((id) => {
    const p = id && byId[id];
    if (!p) return;
    p.games = (p.games || 0) + 1;
    n++;
  });
  return n;
}

/**
 * 撤銷一場（復原或刪除紀錄時用）：場次 -1，最少到 0。直接修改 byId 裡的球員物件。
 * 已經從名單刪除的球員會略過。
 * @returns {number} 實際扣回的人數
 */
export function unrecordGame(byId, ids) {
  let n = 0;
  ids.forEach((id) => {
    const p = id && byId[id];
    if (!p) return;
    p.games = Math.max(0, (p.games || 0) - 1);
    n++;
  });
  return n;
}
