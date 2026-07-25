import { pairKey } from "../content/schema";
import type { Pack, WordPair } from "../content/types";
import { pickIndex, type Rng } from "./rng";

export type PairPool = {
  pairs: readonly WordPair[];
  usedKeys: ReadonlySet<string>;
};

export type DrawResult =
  | { kind: "ok"; pair: WordPair; pool: PairPool }
  | { kind: "exhausted" };

export function buildPool(packs: readonly Pack[]): PairPool {
  return {
    pairs: packs.flatMap((pack) => pack.pairs),
    usedKeys: new Set<string>(),
  };
}

function availablePairs(pool: PairPool): WordPair[] {
  return pool.pairs.filter((pair) => !pool.usedKeys.has(pairKey(pair)));
}

export function remainingCount(pool: PairPool): number {
  return availablePairs(pool).length;
}

/** Exhaustion is a returned value, never a throw — the UI offers recycling. */
export function drawPair(pool: PairPool, rng: Rng): DrawResult {
  const available = availablePairs(pool);
  if (available.length === 0) return { kind: "exhausted" };

  const pair = available[pickIndex(available.length, rng)]!;
  const usedKeys = new Set(pool.usedKeys);
  usedKeys.add(pairKey(pair));

  return { kind: "ok", pair, pool: { pairs: pool.pairs, usedKeys } };
}

export function recyclePool(pool: PairPool): PairPool {
  return { pairs: pool.pairs, usedKeys: new Set<string>() };
}
