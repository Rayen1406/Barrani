import { allPacks } from "../content";
import { buildPool } from "./pairPool";
import { createRng } from "./rng";
import { MAX_PLAYERS, MIN_PLAYERS } from "./roles";
import { canStart, createRound, maxImpostorCount } from "./round";
import { scoreRound } from "./scoring";
import type { RoundConfig, Variant } from "./types";

const VARIANTS: Variant[] = ["barrani", "chbih"];
const ITERATIONS = 10_000;

test("round invariants hold across ten thousand rounds", () => {
  const pool = buildPool(allPacks);

  for (let i = 0; i < ITERATIONS; i++) {
    const playerCount = MIN_PLAYERS + (i % (MAX_PLAYERS - MIN_PLAYERS + 1));
    const variant = VARIANTS[i % VARIANTS.length]!;
    const impostorCount = 1 + (i % maxImpostorCount(playerCount));
    const config: RoundConfig = { playerCount, impostorCount, variant };

    expect(canStart(playerCount, impostorCount)).toBe(true);

    const result = createRound(config, pool, createRng(i));
    if (result.kind !== "ok") throw new Error(`unexpected exhaustion at iteration ${i}`);
    const { round } = result;

    // Every player holds exactly one role, ids are 0..n-1.
    expect(round.assignments).toHaveLength(playerCount);
    expect(round.assignments.map((a) => a.playerId)).toEqual(
      Array.from({ length: playerCount }, (_, id) => id),
    );

    const impostors = round.assignments.filter((a) => a.isImpostor);
    const innocents = round.assignments.filter((a) => !a.isImpostor);

    expect(impostors).toHaveLength(impostorCount);
    expect(new Set(impostors.map((a) => a.playerId)).size).toBe(impostorCount);
    expect(innocents.length).toBeGreaterThanOrEqual(2);

    // All innocents share pair.a.
    for (const innocent of innocents) expect(innocent.word).toBe(round.pair.a);

    // Impostor words depend only on the variant, and never leak a third word.
    for (const impostor of impostors) {
      expect(impostor.word).toBe(variant === "chbih" ? round.pair.b : null);
    }

    // The starting player is at the table.
    expect(round.startingPlayer).toBeGreaterThanOrEqual(0);
    expect(round.startingPlayer).toBeLessThan(playerCount);

    // Scoring conserves the expected totals in all three outcomes.
    const caughtId = impostors[0]!.playerId;
    const innocentId = innocents[0]!.playerId;

    const caughtNoSteal = scoreRound(round, {
      accused: caughtId,
      accusedWasImpostor: true,
      stealBackCorrect: false,
    });
    const caughtWithSteal = scoreRound(round, {
      accused: caughtId,
      accusedWasImpostor: true,
      stealBackCorrect: true,
    });
    const missed = scoreRound(round, {
      accused: innocentId,
      accusedWasImpostor: false,
      stealBackCorrect: false,
    });

    const sum = (d: Record<number, number>) => Object.values(d).reduce((a, b) => a + b, 0);
    expect(sum(caughtNoSteal)).toBe(innocents.length);
    expect(sum(caughtWithSteal)).toBe(innocents.length + 1);
    expect(sum(missed)).toBe(2 * impostorCount);

    // No score is ever negative.
    for (const delta of [caughtNoSteal, caughtWithSteal, missed]) {
      for (const value of Object.values(delta)) expect(value).toBeGreaterThanOrEqual(0);
    }
  }
});

test("the shipped content survives a full drain without repeating", () => {
  let pool = buildPool(allPacks);
  const rng = createRng(1234);
  const seen = new Set<string>();
  const total = allPacks.reduce((sum, pack) => sum + pack.pairs.length, 0);

  for (let i = 0; i < total; i++) {
    const draw = createRound({ playerCount: 5, impostorCount: 1, variant: "barrani" }, pool, rng);
    if (draw.kind !== "ok") throw new Error(`exhausted early at ${i} of ${total}`);
    const key = [draw.round.pair.a, draw.round.pair.b].sort().join("|");
    expect(seen.has(key)).toBe(false);
    seen.add(key);
    pool = draw.pool;
  }

  expect(
    createRound({ playerCount: 5, impostorCount: 1, variant: "barrani" }, pool, rng),
  ).toEqual({ kind: "exhausted" });
});
