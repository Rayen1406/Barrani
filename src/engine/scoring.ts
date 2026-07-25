import type { Round, RoundOutcome, ScoreDelta } from "./types";

/**
 * The round outcome is collective: impostors score the survival bonus only if
 * NO impostor was caught. With two impostors, one being caught means neither
 * scores it. Intentional — it keeps a single vote per round meaningful.
 */
export function scoreRound(round: Round, outcome: RoundOutcome): ScoreDelta {
  const delta: ScoreDelta = {};
  for (const assignment of round.assignments) delta[assignment.playerId] = 0;

  if (outcome.accusedWasImpostor) {
    for (const assignment of round.assignments) {
      if (!assignment.isImpostor) delta[assignment.playerId] = 1;
    }
    if (outcome.stealBackCorrect) {
      delta[outcome.accused] = (delta[outcome.accused] ?? 0) + 1;
    }
  } else {
    for (const assignment of round.assignments) {
      if (assignment.isImpostor) delta[assignment.playerId] = 2;
    }
  }

  return delta;
}

export function applyDelta(scores: ScoreDelta, delta: ScoreDelta): ScoreDelta {
  const out: ScoreDelta = { ...scores };
  for (const [key, value] of Object.entries(delta)) {
    const id = Number(key);
    out[id] = (out[id] ?? 0) + value;
  }
  return out;
}
