import { describe, it, expect } from "vitest";
import { playerStats, sortStats, restMs } from "../src/utils/stats.js";
import { removeMatch } from "../src/utils/matches.js";
import { unrecordGame } from "../src/utils/players.js";
import { canRestoreCourt, resizeCourts } from "../src/utils/board.js";

const P = (id, name, gender = "M") => ({ id, name, gender });
const roster = [P("a", "阿明"), P("b", "小美", "F"), P("c", "大雄"), P("d", "Ben"), P("e", "Emma", "F")];
const M = (ids, endedAt, duration) => ({ id: "m" + endedAt, court: 1, players: ids.map((id) => ({ id, name: id, gender: "M" })), endedAt, startedAt: endedAt - duration, duration });
const matches = [M(["a", "b", "c", "d"], 5000, 3000), M(["a", "b", "c", "e"], 2000, 1000)];

describe("player stats", () => {
  it("每人場數、總時間、平均、最後結束時間", () => {
    const rows = playerStats(roster, matches, { c: "場地 1", d: "等待 1" });
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect([by.a.games, by.a.totalMs, by.a.avgMs, by.a.lastEndedAt]).toEqual([2, 4000, 2000, 5000]);
    expect([by.d.games, by.d.lastEndedAt]).toEqual([1, 5000]);
    expect([by.e.games, by.e.lastEndedAt]).toEqual([1, 2000]);
    expect(by.c.onCourt).toBe(true);
    expect(by.d.onCourt).toBe(false); // 等待區不算在場上
  });

  it("沒打過的人也會出現，場數 0", () => {
    const rows = playerStats([...roster, P("f", "新人")], matches);
    expect(rows.find((r) => r.id === "f")).toMatchObject({ games: 0, totalMs: 0, avgMs: 0, lastEndedAt: null });
  });

  it("休息時間：場上 -1、沒打過 Infinity", () => {
    expect(restMs({ onCourt: true, lastEndedAt: 1 }, 10)).toBe(-1);
    expect(restMs({ onCourt: false, lastEndedAt: null }, 10)).toBe(Infinity);
    expect(restMs({ onCourt: false, lastEndedAt: 4 }, 10)).toBe(6);
  });

  it("排序：場數少到多、休息久到短（沒打過最前、場上最後）", () => {
    const rows = playerStats([...roster, P("f", "新人")], matches, { c: "場地 1" });
    expect(sortStats(rows, "games", 1, 9000).map((r) => r.id).slice(0, 1)).toEqual(["f"]);
    const rest = sortStats(rows, "rest", -1, 9000).map((r) => r.id);
    expect(rest[0]).toBe("f");
    expect(rest[rest.length - 1]).toBe("c");
    expect(rest.indexOf("e")).toBeLessThan(rest.indexOf("a")); // Emma 2000 結束，休息比較久
  });
});

describe("undo / delete", () => {
  it("removeMatch 回傳被刪掉的紀錄", () => {
    const list = matches.slice();
    expect(removeMatch(list, "m2000").endedAt).toBe(2000);
    expect(list.length).toBe(1);
    expect(removeMatch(list, "nope")).toBe(null);
  });

  it("unrecordGame 場次 -1，最少到 0，刪除的球員略過", () => {
    const byId = { a: { games: 2 }, b: { games: 0 } };
    expect(unrecordGame(byId, ["a", "b", "x"])).toBe(2);
    expect([byId.a.games, byId.b.games]).toEqual([1, 0]);
  });

  it("canRestoreCourt 檢查場地與球員是否可以放回", () => {
    const board = { live: resizeCourts([], 2), wait: resizeCourts([], 2) };
    const ids = ["a", "b", "c", "d"];
    expect(canRestoreCourt(board, 0, ids)).toBe("ok");
    expect(canRestoreCourt(board, 5, ids)).toBe("no-court");
    board.wait[1][0] = "a";
    expect(canRestoreCourt(board, 0, ids)).toBe("player-busy");
    board.wait[1][0] = null;
    board.live[0][2] = "z";
    expect(canRestoreCourt(board, 0, ids)).toBe("court-busy");
  });
});
