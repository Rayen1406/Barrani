import 'types.dart';

const int _survivalBonus = 2;
const int _boldGuessBonus = 3;

typedef ScoreDelta = Map<PlayerId, int>;

/// The round outcome is collective: on a vote, impostors score the survival
/// bonus only if NO impostor was caught. Intentional — it keeps a single vote
/// per round meaningful.
ScoreDelta scoreRound(Round round, RoundOutcome outcome) {
  final delta = <PlayerId, int>{
    for (final a in round.assignments) a.playerId: 0,
  };

  void awardInnocents() {
    for (final a in round.assignments) {
      if (!a.isImpostor) delta[a.playerId] = 1;
    }
  }

  void awardImpostors(int points) {
    for (final a in round.assignments) {
      if (a.isImpostor) delta[a.playerId] = points;
    }
  }

  switch (outcome) {
    case VoteOutcome(:final accused, :final accusedWasImpostor, :final stealBackCorrect):
      if (accusedWasImpostor) {
        awardInnocents();
        if (stealBackCorrect) delta[accused] = (delta[accused] ?? 0) + 1;
      } else {
        awardImpostors(_survivalBonus);
      }

    case DeclareOutcome(:final declarer, :final declarerWasImpostor, :final guessCorrect):
      // A declaration by someone who is not البراني hands the round to البراني —
      // which is what stops innocents tapping it to force a reveal.
      if (!declarerWasImpostor) {
        awardImpostors(_survivalBonus);
      } else if (guessCorrect) {
        delta[declarer] = _boldGuessBonus;
      } else {
        awardInnocents();
      }
  }

  return delta;
}

ScoreDelta applyDelta(ScoreDelta scores, ScoreDelta delta) {
  final out = ScoreDelta.of(scores);
  delta.forEach((id, value) => out[id] = (out[id] ?? 0) + value);
  return out;
}
