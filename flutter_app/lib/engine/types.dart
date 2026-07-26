import '../content/types.dart';

enum Variant { barrani, chbih }

/// What the host chose at setup. null means "random", resolved once per round.
typedef VariantSetting = Variant?;

typedef PlayerId = int;

class RoundConfig {
  final int playerCount;
  final int impostorCount;

  /// Already resolved — never random.
  final Variant variant;

  const RoundConfig({
    required this.playerCount,
    required this.impostorCount,
    required this.variant,
  });
}

class Assignment {
  final PlayerId playerId;
  final bool isImpostor;

  /// null only in the barrani variant, where the impostor holds no word.
  final String? word;

  const Assignment({
    required this.playerId,
    required this.isImpostor,
    required this.word,
  });
}

class Round {
  final WordPair pair;
  final Variant variant;
  final List<Assignment> assignments;
  final PlayerId startingPlayer;

  /// questionTargets[asker] = the player that asker must question.
  final List<PlayerId> questionTargets;

  const Round({
    required this.pair,
    required this.variant,
    required this.assignments,
    required this.startingPlayer,
    required this.questionTargets,
  });

  bool isImpostor(PlayerId id) =>
      assignments.any((a) => a.playerId == id && a.isImpostor);
}

/// How a round ended. Sealed so scoring cannot silently mix the two paths.
sealed class RoundOutcome {
  const RoundOutcome();
}

/// The table voted someone out.
class VoteOutcome extends RoundOutcome {
  final PlayerId accused;
  final bool accusedWasImpostor;

  /// Only meaningful when accusedWasImpostor is true.
  final bool stealBackCorrect;

  const VoteOutcome({
    required this.accused,
    required this.accusedWasImpostor,
    this.stealBackCorrect = false,
  });

  VoteOutcome copyWith({bool? stealBackCorrect}) => VoteOutcome(
        accused: accused,
        accusedWasImpostor: accusedWasImpostor,
        stealBackCorrect: stealBackCorrect ?? this.stealBackCorrect,
      );
}

/// Someone stopped the round claiming to be البراني, staking it on the word.
class DeclareOutcome extends RoundOutcome {
  final PlayerId declarer;
  final bool declarerWasImpostor;

  /// Only meaningful when declarerWasImpostor is true.
  final bool guessCorrect;

  const DeclareOutcome({
    required this.declarer,
    required this.declarerWasImpostor,
    this.guessCorrect = false,
  });

  DeclareOutcome copyWith({bool? guessCorrect}) => DeclareOutcome(
        declarer: declarer,
        declarerWasImpostor: declarerWasImpostor,
        guessCorrect: guessCorrect ?? this.guessCorrect,
      );
}
