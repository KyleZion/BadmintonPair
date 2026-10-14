import { describe, it, expect } from "vitest";
import { pairCounts, playerRelations, courtWarnings, pairKey, PAIR_WARN } from "../src/utils/pairs.js";

const M = (ids, endedAt = 1) => ({ id: "m" + endedAt, players: ids.map((id) => ({ id, name: id.toUpperCase(), gender: "M" })), endedAt, duration: 1 });
const matches = [M(["a", "b", "c", "d"], 1), M(["a", "b", "c", "e"], 2), M(["c", "a", "b", "d"], 3)];

describe("搭檔與對手", () => {
  it("pairCounts：同隊兩組、對手四組，順序不影響", () => {
    const { partners, opponents } = pairCounts(matches);
    expect(partners[pairKey("a", "b")]).toBe(2);
    expect(partners[pairKey("a", "c")]).toBe(1);
    expect(opponents[pairKey("a", "c")]).toBe(2);
    expect(opponents[pairKey("b", "a")]).toBe(1);
    const total = Object.values(opponents).reduce((s, n) => s + n, 0);
    expect(total).toBe(12); // 3 場 × 4 組
  });

  it("playerRelations：次數多到少，列出還沒同隊過的人", () => {
    const people = ["a", "b", "c", "d", "e", "f"].map((id) => ({ id, name: id.toUpperCase() }));
    const r = playerRelations("a", matches, people);
    expect(r.partners).toEqual([{ id: "b", name: "B", count: 2 }, { id: "c", name: "C", count: 1 }]);
    expect(r.opponents[0]).toEqual({ id: "c", name: "C", count: 2 });
    expect(r.opponents.map((o) => o.id).sort()).toEqual(["b", "c", "d", "e"]);
    expect(r.neverPartnered).toEqual(["D", "E", "F"]);
  });

  it("courtWarnings：今天同隊或對打達到門檻才標示", () => {
    const counts = pairCounts(matches);
    expect(PAIR_WARN).toBe(2);
    const w = courtWarnings(["a", "b", "c", null], counts);
    expect(w.partners).toEqual([{ a: "a", b: "b", count: 2 }]);
    expect(w.opponents).toEqual([{ a: "b", b: "c", count: 3 }, { a: "a", b: "c", count: 2 }]); // B 和 C 三場都是對手
    expect(courtWarnings(["a", "d", "e", "f"], counts)).toEqual({ partners: [], opponents: [] });
    expect(courtWarnings([null, null, null, null], counts)).toEqual({ partners: [], opponents: [] });
  });
});
