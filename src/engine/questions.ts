import { shuffle, type Rng } from "./rng";
import type { PlayerId } from "./types";

/**
 * Who each player must question, as targets[asker] = target.
 *
 * Built as a random cycle, which guarantees two things a plain random pick
 * would not: nobody is sent to question themselves, and every player is
 * questioned exactly once — so البراني can never slip through unasked.
 */
export function assignQuestionTargets(playerCount: number, rng: Rng): PlayerId[] {
  if (playerCount < 2) return [];

  const order = shuffle(
    Array.from({ length: playerCount }, (_, i) => i),
    rng,
  );

  const targets: PlayerId[] = new Array(playerCount);
  for (let i = 0; i < order.length; i++) {
    targets[order[i]!] = order[(i + 1) % order.length]!;
  }
  return targets;
}
