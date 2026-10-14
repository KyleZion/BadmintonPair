import { describe, it, expect } from "vitest";
import { makeMatch, addMatch, pairType, summarize, formatEndTime, sanitizeMatches, MAX_MATCHES } from "../src/utils/matches.js";

const byId = {
  a: { name: "阿明", gender: "M" },
  b: { name: "小美", gender: "F" },
  c: { name: "大雄", gender: "M" },
  d: { name: "Ben", gender: "M" },
};

describe("matches", () => {
  it("排滿且有開始時間才建立紀錄，並保存球員快照與比賽時間", () => {
    const m = makeMatch(["a", "b", "c", "d"], 1, byId, 1000, 61000);
    expect(m.court).toBe(2);
    expect(m.duration).toBe(60000);
    expect(m.players.map((p) => p.name)).toEqual(["阿明", "小美", "大雄", "Ben"]);
    expect(makeMatch(["a", "b", "c", null], 0, byId, 1000, 2000)).toBe(null);
    expect(makeMatch(["a", "b", "c", "d"], 0, byId, null, 2000)).toBe(null);
  });

  it("快照不受之後名單變動影響", () => {
    const names = { ...byId, a: { ...byId.a } };
    const m = makeMatch(["a", "b", "c", "d"], 0, names, 0, 1);
    names.a.name = "改名";
    expect(m.players[0].name).toBe("阿明");
  });

  it("addMatch 最新的放最前面，超過上限丟最舊的", () => {
    const list = [];
    addMatch(list, { id: "1" });
    addMatch(list, { id: "2" });
    addMatch(list, null);
    expect(list.map((m) => m.id)).toEqual(["2", "1"]);
    const big = Array.from({ length: MAX_MATCHES }, (_, i) => ({ id: "x" + i }));
    addMatch(big, { id: "new" });
    expect(big.length).toBe(MAX_MATCHES);
    expect(big[0].id).toBe("new");
  });

  it("pairType 與 summarize", () => {
    expect(pairType([{ gender: "M" }, { gender: "F" }])).toBe("混雙");
    expect(pairType([{ gender: "F" }, { gender: "F" }])).toBe("女雙");
    expect(summarize([{ duration: 60000 }, { duration: 120000 }])).toEqual({ count: 2, totalMs: 180000, avgMs: 90000 });
    expect(summarize([])).toEqual({ count: 0, totalMs: 0, avgMs: 0 });
  });

  it("formatEndTime：今天只顯示時間，其他日期加上月/日", () => {
    const now = new Date(2026, 9, 12, 20, 0).getTime();
    expect(formatEndTime(new Date(2026, 9, 12, 19, 5).getTime(), now)).toBe("19:05");
    expect(formatEndTime(new Date(2026, 9, 11, 9, 30).getTime(), now)).toBe("10/11 09:30");
  });

  it("sanitizeMatches 略過壞掉的紀錄", () => {
    const good = makeMatch(["a", "b", "c", "d"], 0, byId, 0, 5000);
    const out = sanitizeMatches([good, { players: [] }, null, { ...good, players: good.players.slice(0, 3) }]);
    expect(out.length).toBe(1);
    expect(out[0].duration).toBe(5000);
    expect(sanitizeMatches(undefined)).toEqual([]);
  });
});
