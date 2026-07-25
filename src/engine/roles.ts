import type { WordPair } from "../content/types";
import { shuffle, type Rng } from "./rng";
import type { Assignment, PlayerId, Round, RoundConfig } from "./types";

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

export function assignRoles(config: RoundConfig, pair: WordPair, rng: Rng): Assignment[] {
  const ids = Array.from({ length: config.playerCount }, (_, i) => i);
  const impostorIds = new Set(shuffle(ids, rng).slice(0, config.impostorCount));

  return ids.map((playerId) => {
    const isImpostorPlayer = impostorIds.has(playerId);
    const word = isImpostorPlayer ? (config.variant === "chbih" ? pair.b : null) : pair.a;
    return { playerId, isImpostor: isImpostorPlayer, word };
  });
}

export function isImpostor(round: Round, playerId: PlayerId): boolean {
  return round.assignments.some((a) => a.playerId === playerId && a.isImpostor);
}
