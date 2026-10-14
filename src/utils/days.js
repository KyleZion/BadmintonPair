/**
 * 過去的日子（純函式，不依賴 Vue）
 *
 * 按「開始新的一天」時，今天的比賽紀錄不刪掉，而是封存成一天：
 *   { id, date: 'YYYY-MM-DD', matches: Match[] }   matches 最新的在前面
 * 日期用當天最早一場比賽結束的日期，打過午夜也算同一天；同一個日期封存兩次會合併。
 * 只保留最近 KEEP_DAYS 天（以日期計），超過的自動刪除。
 */
import { sanitizeMatches } from "./matches.js";

export const KEEP_DAYS = 120;
const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const pad = (n) => String(n).padStart(2, "0");

/** 時間戳 → 當地日期 'YYYY-MM-DD' */
export function dateKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const keyToDate = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** 顯示用文字：short "10/13"、week "週一"、long "10 月 13 日（週一）" */
export function dayLabel(key) {
  const d = keyToDate(key);
  const week = "週" + WEEK[d.getDay()];
  return { short: `${d.getMonth() + 1}/${d.getDate()}`, week, day: d.getDate(), long: `${d.getMonth() + 1} 月 ${d.getDate()} 日（${week}）` };
}

/** 刪除超過保留天數的日子（直接修改 days），回傳刪掉幾天 */
export function pruneDays(days, now = Date.now(), keep = KEEP_DAYS) {
  const t = new Date(now);
  const cutoff = dateKey(new Date(t.getFullYear(), t.getMonth(), t.getDate() - keep + 1).getTime());
  const before = days.length;
  for (let i = days.length - 1; i >= 0; i--) if (days[i].date < cutoff) days.splice(i, 1);
  return before - days.length;
}

/**
 * 把今天的比賽紀錄封存成一天（直接修改 days）。沒有紀錄就不封存，回傳 null。
 * 同一個日期已經有封存時合併進去。回傳封存後的那一天與是否為合併。
 */
export function archiveDay(days, matches, now = Date.now()) {
  if (!matches.length) return null;
  const firstEnd = Math.min(...matches.map((m) => m.endedAt));
  const date = dateKey(firstEnd);
  const copy = matches.map((m) => ({ ...m, players: m.players.map((p) => ({ ...p })) }));
  let day = days.find((d) => d.date === date);
  const merged = !!day;
  if (day) {
    day.matches = copy.concat(day.matches).sort((a, b) => b.endedAt - a.endedAt);
  } else {
    day = { id: "d" + date.replace(/-/g, "") + Math.random().toString(36).slice(2, 5), date, matches: copy };
    days.push(day);
  }
  days.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  pruneDays(days, now);
  return { day, merged, addedCount: copy.length };
}

/** 一天的摘要：場數、參與人數、總時間、平均時間 */
export function daySummary(matches) {
  const ids = new Set();
  let total = 0;
  matches.forEach((m) => {
    total += m.duration || 0;
    m.players.forEach((p) => ids.add(p.id || p.name));
  });
  return { count: matches.length, players: ids.size, totalMs: total, avgMs: matches.length ? Math.round(total / matches.length) : 0 };
}

/** 讀回存檔時檢查格式 */
export function sanitizeDays(arr, now = Date.now()) {
  if (!Array.isArray(arr)) return [];
  const days = arr
    .filter((d) => d && typeof d.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date))
    .map((d) => ({ id: String(d.id || "d" + d.date), date: d.date, matches: sanitizeMatches(d.matches) }))
    .filter((d) => d.matches.length);
  days.sort((a, b) => (a.date < b.date ? 1 : -1));
  pruneDays(days, now);
  return days;
}
