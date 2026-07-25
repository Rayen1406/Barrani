import type { Pack } from "../content/types";
import { buildPool, remainingCount } from "./pairPool";
import { createRng } from "./rng";
import { canStart, createRound, maxImpostorCount, resolveVariant, suggestImpostorCount } from "./round";

function packOf(count: number): Pack {
  return {
    id: "test",
    name: "test",
    tier: "family",
    emoji: "🍲",
    pairs: Array.from({ length: count }, (_, i) => ({ a: `أ${i}`, b: `ب${i}` })),
  };
}

test("suggests one impostor up to six players, two from seven", () => {
  expect([3, 4, 5, 6].map(suggestImpostorCount)).toEqual([1, 1, 1, 1]);
  expect([7, 8, 12].map(suggestImpostorCount)).toEqual([2, 2, 2]);
});

test("impostors are capped so at least two innocents remain", () => {
  expect(maxImpostorCount(3)).toBe(1);
  expect(maxImpostorCount(6)).toBe(4);
});

test("canStart rejects too few players and impossible impostor counts", () => {
  expect(canStart(2, 1)).toBe(false);
  expect(canStart(13, 1)).toBe(false);
  expect(canStart(3, 0)).toBe(false);
  expect(canStart(3, 2)).toBe(false);
  expect(canStart(3, 1)).toBe(true);
  expect(canStart(12, 2)).toBe(true);
});

test("resolveVariant passes through an explicit choice", () => {
  expect(resolveVariant("barrani", createRng(1))).toBe("barrani");
  expect(resolveVariant("chbih", createRng(1))).toBe("chbih");
});

test("resolveVariant produces both variants over many seeds when random", () => {
  const seen = new Set(
    Array.from({ length: 60 }, (_, seed) => resolveVariant("random", createRng(seed))),
  );
  expect(seen).toEqual(new Set(["barrani", "chbih"]));
});

test("createRound draws a pair, assigns roles, and consumes from the pool", () => {
  const pool = buildPool([packOf(10)]);
  const result = createRound(
    { playerCount: 5, impostorCount: 1, variant: "barrani" },
    pool,
    createRng(1),
  );
  expect(result.kind).toBe("ok");
  if (result.kind !== "ok") return;
  expect(result.round.assignments).toHaveLength(5);
  expect(remainingCount(result.pool)).toBe(9);
});

test("createRound picks a starting player inside the table", () => {
  const pool = buildPool([packOf(10)]);
  for (let seed = 0; seed < 30; seed++) {
    const result = createRound(
      { playerCount: 4, impostorCount: 1, variant: "chbih" },
      pool,
      createRng(seed),
    );
    if (result.kind !== "ok") throw new Error("unexpected exhaustion");
    expect(result.round.startingPlayer).toBeGreaterThanOrEqual(0);
    expect(result.round.startingPlayer).toBeLessThan(4);
  }
});

test("createRound reports exhaustion instead of throwing", () => {
  const pool = buildPool([]);
  expect(
    createRound({ playerCount: 4, impostorCount: 1, variant: "barrani" }, pool, createRng(1)),
  ).toEqual({ kind: "exhausted" });
});

test("both words in the round come from the same pair", () => {
  const pool = buildPool([packOf(10)]);
  const result = createRound(
    { playerCount: 6, impostorCount: 2, variant: "chbih" },
    pool,
    createRng(6),
  );
  if (result.kind !== "ok") throw new Error("unexpected exhaustion");
  const words = new Set(result.round.assignments.map((a) => a.word));
  expect(words).toEqual(new Set([result.round.pair.a, result.round.pair.b]));
});
