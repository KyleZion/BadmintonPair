/**
 * 場地計時（純函式，不依賴 Vue）
 *
 * 規則
 *   上場場地 4 個位置都排滿 → 開始計時（記下開始時間）
 *   場地沒有排滿（按「結束」清空，或有人被移回休息區）→ 計時清除
 *   排滿時互換或替換球員 → 場地仍然是滿的，繼續計時
 *
 * startedAt[c] 是場地 c 的開始時間（毫秒時間戳），沒在計時就是 null。
 * 存的是開始時間而不是經過秒數，所以重新整理頁面、手機鎖屏後回來，時間都還是對的。
 */

export const isFullCourt = (court) => Array.isArray(court) && court.length === 4 && court.every(Boolean);

/**
 * 依場地目前是否排滿，算出新的 startedAt 陣列（長度與 live 相同）
 * @param {(string|null)[][]} live
 * @param {(number|null)[]} startedAt
 * @param {number} now
 * @returns {(number|null)[]}
 */
export function syncTimers(live, startedAt, now) {
  return live.map((court, i) => {
    if (!isFullCourt(court)) return null;
    const prev = Array.isArray(startedAt) ? startedAt[i] : null;
    return typeof prev === "number" && Number.isFinite(prev) ? prev : now;
  });
}

/** 兩個 startedAt 陣列是否相同（避免沒有變化時也觸發寫入） */
export const sameTimers = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * 經過的毫秒數 → "分:秒"，例如 65000 → "01:05"；超過一小時分鐘數會繼續往上加（例如 "75:20"）
 * @param {number} ms
 */
export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

/** 長時間的顯示：一小時內用 "分:秒"，超過用 "3h05"（累計時數用，避免數字太長） */
export function formatDuration(ms) {
  if (ms < 3600000) return formatElapsed(ms);
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}
