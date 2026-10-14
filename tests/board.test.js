import { describe, it, expect } from "vitest";
import * as B from "../src/utils/board.js";
import { parseToken, parseBulk, mergePlayers, teamType, recordGame } from "../src/utils/players.js";

const mkBoard = (n = 2) => ({ live: B.resizeCourts([], n), wait: B.resizeCourts([], n) });

describe("players", () => {
  it("parseToken 解析名字後面的性別", () => {
    expect(parseToken("小明 男")).toEqual({ name: "小明", gender: "M" });
    expect(parseToken("Amy F")).toEqual({ name: "Amy", gender: "F" });
    expect(parseToken("小華(女)")).toEqual({ name: "小華", gender: "F" });
    expect(parseToken("阿男")).toEqual({ name: "阿男", gender: null });
  });

  it("parseBulk 支援換行與逗號", () => {
    expect(parseBulk("a 男\nb 女,c")).toHaveLength(3);
  });

  it("mergePlayers 略過重複並套用預設性別", () => {
    const { added, skipped } = mergePlayers([{ id: "1", name: "Amy", gender: "F" }], parseBulk("amy, Ben"), "M");
    expect(skipped).toEqual(["amy"]);
    expect(added.map((p) => [p.name, p.gender])).toEqual([["Ben", "M"]]);
  });

  it("recordGame 讓場上每個人的場次 +1，空位和不存在的 id 略過", () => {
    const byId = { a: { games: 2 }, b: { games: 0 }, c: {} };
    expect(recordGame(byId, ["a", "b", "c", null])).toBe(3);
    expect(recordGame(byId, ["x"])).toBe(0);
    expect([byId.a.games, byId.b.games, byId.c.games]).toEqual([3, 1, 1]);
  });

  it("新球員與範例名單的場次從 0 開始", () => {
    const { added } = mergePlayers([], parseBulk("Ben"), "M");
    expect(added[0].games).toBe(0);
  });

  it("teamType 判斷男雙／女雙／混雙", () => {
    const byId = { a: { gender: "M" }, b: { gender: "F" }, c: { gender: "M" } };
    expect(teamType(["a", "c"], byId)).toBe("男雙");
    expect(teamType(["a", "b"], byId)).toBe("混雙");
    expect(teamType(["a", null], byId)).toBe("");
  });
});

describe("board", () => {
  it("休息區的人放進空位", () => {
    const b = mkBoard();
    const r = B.tapSlot(b, { zone: "rest", id: "p1" }, "live", 0, 2);
    expect(r).toEqual({ sel: null, action: "place" });
    expect(b.live[0]).toEqual([null, null, "p1", null]);
  });

  it("休息區的人放進有人的格子：原本的人被換下", () => {
    const b = mkBoard();
    b.live[0][0] = "p1";
    B.tapSlot(b, { zone: "rest", id: "p2" }, "live", 0, 0);
    expect(b.live[0][0]).toBe("p2");
    expect(B.locatePlayers(b).p1).toBeUndefined();
  });

  it("兩格互換（跨區）", () => {
    const b = mkBoard();
    b.live[0][0] = "p1";
    b.wait[1][3] = "p2";
    B.tapSlot(b, { zone: "live", c: 0, s: 0 }, "wait", 1, 3);
    expect(b.live[0][0]).toBe("p2");
    expect(b.wait[1][3]).toBe("p1");
  });

  it("點空格但沒有選取 → need-select", () => {
    expect(B.tapSlot(mkBoard(), null, "live", 0, 0).action).toBe("need-select");
  });

  it("placeInNextEmpty 先填上場區", () => {
    const b = mkBoard(1);
    b.live[0] = ["a", "b", "c", null];
    expect(B.placeInNextEmpty(b, "d")).toEqual({ zone: "live", c: 0, s: 3 });
    expect(B.placeInNextEmpty(b, "e")).toEqual({ zone: "wait", c: 0, s: 0 });
  });

  it("promoteWaiting 移到第一個空的上場場地", () => {
    const b = mkBoard(2);
    b.live[0] = ["a", "b", "c", "d"];
    b.wait[0] = ["e", "f", "g", "h"];
    expect(B.promoteWaiting(b, 0)).toBe(1);
    expect(b.live[1]).toEqual(["e", "f", "g", "h"]);
    expect(B.isEmptyCourt(b.wait[0])).toBe(true);
    b.wait[1] = ["i", null, null, null];
    expect(B.promoteWaiting(b, 1)).toBe(-1);
  });

  it("promoteWaiting 優先上對應的場地", () => {
    const b = mkBoard(3);
    b.wait[2] = ["a", "b", "c", "d"];
    expect(B.promoteWaiting(b, 2)).toBe(2);
    b.live[2] = ["e", null, null, null];
    b.wait[2] = ["f", "g", "h", "i"];
    expect(B.promoteWaiting(b, 2)).toBe(0);
  });

  it("sanitizeCourts 清掉不存在的 id 並調整面數", () => {
    const out = B.sanitizeCourts([["a", "x", null, "b"]], new Set(["a", "b"]), 2);
    expect(out).toEqual([["a", null, null, "b"], [null, null, null, null]]);
  });
});
