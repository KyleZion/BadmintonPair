import { describe, it, expect } from "vitest";
import { syncTimers, formatElapsed, isFullCourt } from "../src/utils/timer.js";

const FULL = ["a", "b", "c", "d"];
const PART = ["a", "b", "c", null];
const EMPTY = [null, null, null, null];

describe("timer", () => {
  it("排滿才開始計時", () => {
    expect(syncTimers([FULL, PART, EMPTY], [null, null, null], 1000)).toEqual([1000, null, null]);
  });

  it("已經在計時的場地保留原本的開始時間（換人也繼續計時）", () => {
    expect(syncTimers([["e", "b", "c", "d"]], [500], 9000)).toEqual([500]);
  });

  it("沒排滿（結束或有人離開）就清除計時", () => {
    expect(syncTimers([EMPTY, PART], [500, 600], 9000)).toEqual([null, null]);
  });

  it("場地數改變時長度跟著 live", () => {
    expect(syncTimers([FULL, FULL], [500], 9000)).toEqual([500, 9000]);
    expect(syncTimers([FULL], [500, 600, 700], 9000)).toEqual([500]);
  });

  it("舊存檔沒有 startedAt 也能處理", () => {
    expect(syncTimers([FULL, EMPTY], undefined, 42)).toEqual([42, null]);
  });

  it("formatElapsed 顯示分:秒", () => {
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(65_000)).toBe("01:05");
    expect(formatElapsed(599_999)).toBe("09:59");
    expect(formatElapsed(75 * 60_000 + 20_000)).toBe("75:20");
    expect(formatElapsed(-5000)).toBe("00:00");
  });

  it("isFullCourt", () => {
    expect(isFullCourt(FULL)).toBe(true);
    expect(isFullCourt(PART)).toBe(false);
  });
});

import { formatDuration } from "../src/utils/timer.js";
describe("formatDuration", () => {
  it("一小時內用分:秒，超過用 3h05", () => {
    expect(formatDuration(59 * 60000 + 5000)).toBe("59:05");
    expect(formatDuration(3 * 3600000 + 5 * 60000 + 40000)).toBe("3h05");
  });
});
