import { describe, it, expect } from "vitest";
import { clearDay, hasDayData, resizeCourts } from "../src/utils/board.js";

const fresh = () => ({
  players: [{ id: "a", games: 3 }, { id: "b", games: 0 }, { id: "c", games: 1 }],
  matches: [{ id: "m1" }, { id: "m2" }],
  courtCount: 2,
  live: [["a", "b", "c", "d"], [null, null, null, null]],
  wait: [["e", null, null, null], [null, null, null, null]],
});

describe("開始新的一天", () => {
  it("場次歸零、清除紀錄、所有人回休息區，名單與場地數保留", () => {
    const s = fresh();
    expect(clearDay(s)).toEqual({ matches: 2, onCourts: 5 });
    expect(s.players.map((p) => p.games)).toEqual([0, 0, 0]);
    expect(s.players.length).toBe(3);
    expect(s.matches).toEqual([]);
    expect(s.courtCount).toBe(2);
    expect(s.live).toEqual(resizeCourts([], 2));
    expect(s.wait).toEqual(resizeCourts([], 2));
  });

  it("hasDayData：有場次、紀錄或場上有人才需要重新開始", () => {
    const s = fresh();
    expect(hasDayData(s)).toBe(true);
    clearDay(s);
    expect(hasDayData(s)).toBe(false);
    s.players[0].games = 1;
    expect(hasDayData(s)).toBe(true);
    s.players[0].games = 0;
    s.wait[1][2] = "x";
    expect(hasDayData(s)).toBe(true);
  });
});
