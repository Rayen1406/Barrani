import '../content/packs.dart';
import '../content/types.dart';
import '../engine/pair_pool.dart';
import '../engine/scoring.dart';
import '../engine/types.dart';
import 'phase.dart';

class Player {
  final PlayerId id;
  final String name;
  const Player(this.id, this.name);
}

class Session {
  final List<Player> players;
  final List<String> selectedPackIds;
  final bool friendsUnlocked;
  final VariantSetting variantSetting;
  final int impostorCount;

  /// null means no discussion timer.
  final int? timerSeconds;

  /// Consumed and incremented on every round, keeping the reducer pure.
  final int nextSeed;
  final PairPool pool;

  /// Which pack selection the pool was built from, so it rebuilds when changed.
  final List<String> poolPackIds;
  final Round? round;
  final ScoreDelta scores;
  final Phase phase;

  /// Set when the pack selection ran out of unused pairs.
  final bool exhausted;

  const Session({
    required this.players,
    required this.selectedPackIds,
    required this.friendsUnlocked,
    required this.variantSetting,
    required this.impostorCount,
    required this.timerSeconds,
    required this.nextSeed,
    required this.pool,
    required this.poolPackIds,
    required this.round,
    required this.scores,
    required this.phase,
    required this.exhausted,
  });

  Session copyWith({
    List<Player>? players,
    List<String>? selectedPackIds,
    bool? friendsUnlocked,
    VariantSetting? variantSetting,
    bool clearVariant = false,
    int? impostorCount,
    int? timerSeconds,
    bool clearTimer = false,
    int? nextSeed,
    PairPool? pool,
    List<String>? poolPackIds,
    Round? round,
    bool clearRound = false,
    ScoreDelta? scores,
    Phase? phase,
    bool? exhausted,
  }) {
    return Session(
      players: players ?? this.players,
      selectedPackIds: selectedPackIds ?? this.selectedPackIds,
      friendsUnlocked: friendsUnlocked ?? this.friendsUnlocked,
      variantSetting: clearVariant ? null : (variantSetting ?? this.variantSetting),
      impostorCount: impostorCount ?? this.impostorCount,
      timerSeconds: clearTimer ? null : (timerSeconds ?? this.timerSeconds),
      nextSeed: nextSeed ?? this.nextSeed,
      pool: pool ?? this.pool,
      poolPackIds: poolPackIds ?? this.poolPackIds,
      round: clearRound ? null : (round ?? this.round),
      scores: scores ?? this.scores,
      phase: phase ?? this.phase,
      exhausted: exhausted ?? this.exhausted,
    );
  }

  static List<String> get familyPackIds =>
      allPacks.where((p) => p.tier == Tier.family).map((p) => p.id).toList();

  factory Session.initial({
    int seed = 1,
    List<String> playerNames = const [],
    List<String>? selectedPackIds,
    bool friendsUnlocked = false,
    VariantSetting variantSetting,
    int impostorCount = 1,
    int? timerSeconds = 180,
  }) {
    final packIds = selectedPackIds ?? familyPackIds;
    return Session(
      players: [
        for (var i = 0; i < playerNames.length; i++) Player(i, playerNames[i]),
      ],
      selectedPackIds: List.of(packIds),
      friendsUnlocked: friendsUnlocked,
      variantSetting: variantSetting,
      impostorCount: impostorCount,
      timerSeconds: timerSeconds,
      nextSeed: seed,
      pool: PairPool.build(allPacks.where((p) => packIds.contains(p.id))),
      poolPackIds: List.of(packIds),
      round: null,
      scores: const {},
      phase: const HomePhase(),
      exhausted: false,
    );
  }

  /// Whose turn it is to ask, walking the table from the round's start.
  PlayerId? get currentAsker {
    final p = phase;
    if (p is! QuestionsPhase || round == null || players.isEmpty) return null;
    return (round!.startingPlayer + p.offset) % players.length;
  }

  /// Who the current asker must question, chosen by the engine at deal time.
  PlayerId? get currentTarget {
    final asker = currentAsker;
    if (asker == null || round == null) return null;
    final targets = round!.questionTargets;
    return asker < targets.length ? targets[asker] : null;
  }

  Player? playerById(PlayerId id) {
    for (final p in players) {
      if (p.id == id) return p;
    }
    return null;
  }
}
