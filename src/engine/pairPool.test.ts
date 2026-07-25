import type { Pack } from "../content/types";
import { buildPool, drawPair, recyclePool, remainingCount } from "./pairPool";
import { createRng } from "./rng";

function packOf(id: string, count: number): Pack {
  return {
    id,
    name: id,
    tier: "family",
    emoji: "🍲",
    pairs: Array.from({ length: count }, (_, i) => ({ a: `${id}-أ${i}`, b: `${id}-ب${i}` })),
  };
}

test("buildPool collects pairs from every pack given", () => {
  const pool = buildPool([packOf("one", 3), packOf("two", 4)]);
  expect(pool.pairs).toHaveLength(7);
  expect(remainingCount(pool)).toBe(7);
});

test("buildPool of no packs is empty and immediately exhausted", () => {
  const pool = buildPool([]);
  expect(remainingCount(pool)).toBe(0);
  expect(drawPair(pool, createRng(1))).toEqual({ kind: "exhausted" });
});

test("drawing returns a pair and marks it used", () => {
  const pool = buildPool([packOf("one", 3)]);
  const result = drawPair(pool, createRng(1));
  expect(result.kind).toBe("ok");
  if (result.kind !== "ok") return;
  expect(remainingCount(result.pool)).toBe(2);
});

test("drawing never repeats a pair until the pool is exhausted", () => {
  let pool = buildPool([packOf("one", 30), packOf("two", 30)]);
  const rng = createRng(99);
  const seen = new Set<string>();

  for (let i = 0; i < 60; i++) {
    const result = drawPair(pool, rng);
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    const key = `${result.pair.a}|${result.pair.b}`;
    expect(seen.has(key)).toBe(false);
    seen.add(key);
    pool = result.pool;
  }

  expect(drawPair(pool, rng)).toEqual({ kind: "exhausted" });
});

test("drawing does not mutate the pool it was given", () => {
  const pool = buildPool([packOf("one", 5)]);
  drawPair(pool, createRng(4));
  expect(remainingCount(pool)).toBe(5);
});

test("recyclePool clears used pairs and keeps the same pairs", () => {
  let pool = buildPool([packOf("one", 2)]);
  for (let i = 0; i < 2; i++) {
    const result = drawPair(pool, createRng(i));
    if (result.kind === "ok") pool = result.pool;
  }
  expect(remainingCount(pool)).toBe(0);

  const recycled = recyclePool(pool);
  expect(remainingCount(recycled)).toBe(2);
  expect(recycled.pairs).toEqual(pool.pairs);
});

test("a reversed duplicate across packs is only drawable once", () => {
  const a: Pack = {
    id: "a", name: "a", tier: "family", emoji: "🍲", pairs: [{ a: "كسكسي", b: "مقرونة" }],
  };
  const b: Pack = {
    id: "b", name: "b", tier: "family", emoji: "🍲", pairs: [{ a: "مقرونة", b: "كسكسي" }],
  };
  const pool = buildPool([a, b]);
  const first = drawPair(pool, createRng(1));
  expect(first.kind).toBe("ok");
  if (first.kind !== "ok") return;
  expect(drawPair(first.pool, createRng(1))).toEqual({ kind: "exhausted" });
});
