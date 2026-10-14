import { describe, it, expect } from "vitest";
import { archiveDay, pruneDays, dateKey, dayLabel, daySummary, sanitizeDays, KEEP_DAYS } from "../src/utils/days.js";
import { cumulativeStats, playersFromMatches } from "../src/utils/stats.js";

const at = (y, m, d, h = 20) => new Date(y, m - 1, d, h, 0).getTime();
const P = (id, name, gender = "M") => ({ id, name, gender });
const M = (ids, endedAt, duration = 600000) => ({
  id: "m" + endedAt + ids.join(""),
  court: 1,
  players: ids.map((id) => P(id, id.toUpperCase(), id === "b" ? "F" : "M")),
  startedAt: endedAt - duration,
  endedAt,
  duration,
});

describe("過去的日子", () => {
  it("封存：日期用最早一場的結束日期（打過午夜仍算同一天）", () => {
    const days = [];
    const r = archiveDay(days, [M(["a", "b", "c", "d"], at(2026, 10, 14, 0)), M(["a", "b", "c", "d"], at(2026, 10, 13, 22))], at(2026, 10, 14, 1));
    expect(r.day.date).toBe("2026-10-13");
    expect(r.addedCount).toBe(2);
    expect(days.length).toBe(1);
  });

  it("沒有紀錄就不封存", () => {
    expect(archiveDay([], [])).toBe(null);
  });

  it("同一個日期封存兩次會合併，日子依日期新到舊排序", () => {
    const days = [];
    archiveDay(days, [M(["a", "b", "c", "d"], at(2026, 10, 12))], at(2026, 10, 14));
    archiveDay(days, [M(["a", "b", "c", "d"], at(2026, 10, 13, 19))], at(2026, 10, 14));
    const r = archiveDay(days, [M(["e", "b", "c", "d"], at(2026, 10, 13, 21))], at(2026, 10, 14));
    expect(r.merged).toBe(true);
    expect(days.map((d) => d.date)).toEqual(["2026-10-13", "2026-10-12"]);
    expect(days[0].matches.length).toBe(2);
    expect(days[0].matches[0].endedAt).toBeGreaterThan(days[0].matches[1].endedAt);
  });

  it(`只保留最近 ${KEEP_DAYS} 天`, () => {
    const now = at(2026, 10, 14);
    const days = [
      { id: "1", date: dateKey(at(2026, 10, 1)), matches: [] },
      { id: "2", date: dateKey(new Date(2026, 9, 14 - KEEP_DAYS + 1).getTime()), matches: [] }, // 剛好第 120 天，保留
      { id: "3", date: dateKey(new Date(2026, 9, 14 - KEEP_DAYS).getTime()), matches: [] }, // 第 121 天，刪除
    ];
    expect(pruneDays(days, now)).toBe(1);
    expect(days.map((d) => d.id)).toEqual(["1", "2"]);
  });

  it("dayLabel 與 daySummary", () => {
    expect(dayLabel("2026-10-13")).toMatchObject({ short: "10/13", week: "週二", long: "10 月 13 日（週二）" });
    expect(daySummary([M(["a", "b", "c", "d"], 1, 60000), M(["a", "b", "e", "f"], 2, 120000)])).toEqual({ count: 2, players: 6, totalMs: 180000, avgMs: 90000 });
  });

  it("sanitizeDays 略過壞資料與空的日子", () => {
    const now = at(2026, 10, 14);
    const good = { id: "x", date: "2026-10-13", matches: [M(["a", "b", "c", "d"], at(2026, 10, 13))] };
    expect(sanitizeDays([good, { date: "bad" }, null, { id: "y", date: "2026-10-12", matches: [] }], now).map((d) => d.id)).toEqual(["x"]);
  });
});

describe("累計統計", () => {
  it("出席天數、總場數，名單上沒打過的人也列出，名字以名單為準", () => {
    const day1 = { matches: [M(["a", "b", "c", "d"], 1), M(["a", "b", "c", "e"], 2)] };
    const day2 = { matches: [M(["a", "f", "c", "d"], 3)] };
    const rows = cumulativeStats([day1, day2], [P("a", "阿明"), P("z", "新人")]);
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect([by.a.name, by.a.days, by.a.games]).toEqual(["阿明", 2, 3]);
    expect([by.e.days, by.e.games]).toEqual([1, 1]);
    expect([by.z.days, by.z.games]).toEqual([0, 0]);
  });

  it("playersFromMatches 用最新一場的名字", () => {
    const old = { ...M(["a", "b", "c", "d"], 1) };
    const neu = { ...M(["a", "b", "c", "d"], 2) };
    neu.players = neu.players.map((p) => (p.id === "a" ? { ...p, name: "新名字" } : p));
    expect(playersFromMatches([old, neu]).find((p) => p.id === "a").name).toBe("新名字");
  });
});
