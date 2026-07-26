import type { Round, RoundOutcome, ScoreDelta } from "./types";

const SURVIVAL_BONUS = 2;
const BOLD_GUESS_BONUS = 3;

function blank(round: Round): ScoreDelta {
  const delta: ScoreDelta = {};
  for (const assignment of round.assignments) delta[assignment.playerId] = 0;
  return delta;
}

function awardInnocents(round: Round, delta: ScoreDelta): void {
  for (const assignment of round.assignments) {
    if (!assignment.isImpostor) delta[assignment.playerId] = 1;
  }
}

function awardImpostors(round: Round, delta: ScoreDelta, points: number): void {
  for (const assignment of round.assignments) {
    if (assignment.isImpostor) delta[assignment.playerId] = points;
  }
}

/**
 * The round outcome is collective: on a vote, impostors score the survival
 * bonus only if NO impostor was caught. Intentional — it keeps a single vote
 * per round meaningful.
 */
export function scoreRound(round: Round, outcome: RoundOutcome): ScoreDelta {
  const delta = blank(round);

  if (outcome.kind === "vote") {
    if (outcome.accusedWasImpostor) {
      awardInnocents(round, delta);
      if (outcome.stealBackCorrect) {
        delta[outcome.accused] = (delta[outcome.accused] ?? 0) + 1;
      }
    } else {
      awardImpostors(round, delta, SURVIVAL_BONUS);
    }
    return delta;
  }

  // A declaration by someone who is not البراني hands the round to البراني —
  // which is what stops innocents from tapping it to force a reveal.
  if (!outcome.declarerWasImpostor) {
    awardImpostors(round, delta, SURVIVAL_BONUS);
    return delta;
  }

  if (outcome.guessCorrect) {
    delta[outcome.declarer] = BOLD_GUESS_BONUS;
  } else {
    awardInnocents(round, delta);
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
