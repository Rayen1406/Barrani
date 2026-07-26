import { shuffle, type Rng } from "./rng";
import type { PlayerId } from "./types";

/** Two turns around the table — one question each is not enough to go on. */
export const QUESTION_PASSES = 2;

/** One pass: targets[asker] = target, built as a random cycle. */
function onePass(playerCount: number, rng: Rng): PlayerId[] {
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

/**
 * Who each player questions, per pass: targets[pass][asker] = target.
 *
 * Each pass is an independent random cycle, which guarantees two things a
 * plain random pick would not: nobody is sent to question themselves, and
 * every player is questioned exactly once per pass — so البراني can never
 * slip through a round unasked. Passes are drawn separately so the second
 * turn generally pairs people up differently from the first.
 */
export function assignQuestionTargets(
  playerCount: number,
  rng: Rng,
  passes = QUESTION_PASSES,
): PlayerId[][] {
  if (playerCount < 2) return Array.from({ length: passes }, () => []);
  return Array.from({ length: passes }, () => onePass(playerCount, rng));
}
