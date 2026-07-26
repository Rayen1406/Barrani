import { drawPair, type PairPool } from "./pairPool";
import { assignQuestionTargets } from "./questions";
import { assignRoles, MAX_PLAYERS, MIN_PLAYERS } from "./roles";
import { pickIndex, type Rng } from "./rng";
import type { Round, RoundConfig, Variant, VariantSetting } from "./types";

export function suggestImpostorCount(playerCount: number): number {
  return playerCount >= 7 ? 2 : 1;
}

/** At least two innocents must remain, otherwise there is no game to play. */
export function maxImpostorCount(playerCount: number): number {
  return Math.max(1, playerCount - 2);
}

export function canStart(playerCount: number, impostorCount: number): boolean {
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) return false;
  if (impostorCount < 1) return false;
  return impostorCount <= maxImpostorCount(playerCount);
}

export function resolveVariant(setting: VariantSetting, rng: Rng): Variant {
  if (setting !== "random") return setting;
  return rng() < 0.5 ? "barrani" : "chbih";
}

export type CreateRoundResult =
  | { kind: "ok"; round: Round; pool: PairPool }
  | { kind: "exhausted" };

export function createRound(config: RoundConfig, pool: PairPool, rng: Rng): CreateRoundResult {
  const draw = drawPair(pool, rng);
  if (draw.kind === "exhausted") return { kind: "exhausted" };

  const round: Round = {
    pair: draw.pair,
    variant: config.variant,
    assignments: assignRoles(config, draw.pair, rng),
    startingPlayer: pickIndex(config.playerCount, rng),
    questionTargets: assignQuestionTargets(config.playerCount, rng),
  };

  return { kind: "ok", round, pool: draw.pool };
}
