import '../content/types.dart';
import 'pair_pool.dart';
import 'rng.dart';
import 'types.dart';

const int minPlayers = 3;
const int maxPlayers = 12;

List<Assignment> assignRoles(RoundConfig config, WordPair pair, Rng rng) {
  final ids = List<int>.generate(config.playerCount, (i) => i);
  final impostorIds = rng.shuffle(ids).take(config.impostorCount).toSet();

  return ids.map((playerId) {
    final isImpostor = impostorIds.contains(playerId);
    final word = isImpostor
        ? (config.variant == Variant.chbih ? pair.b : null)
        : pair.a;
    return Assignment(
      playerId: playerId,
      isImpostor: isImpostor,
      word: word,
    );
  }).toList();
}

/// Who each player must question, as targets[asker] = target.
///
/// Built as a random cycle, which guarantees two things a plain random pick
/// would not: nobody is sent to question themselves, and every player is
/// questioned exactly once — so البراني can never slip through unasked.
List<PlayerId> assignQuestionTargets(int playerCount, Rng rng) {
  if (playerCount < 2) return const [];

  final order = rng.shuffle(List<int>.generate(playerCount, (i) => i));
  final targets = List<int>.filled(playerCount, 0);
  for (var i = 0; i < order.length; i++) {
    targets[order[i]] = order[(i + 1) % order.length];
  }
  return targets;
}

int suggestImpostorCount(int playerCount) => playerCount >= 7 ? 2 : 1;

/// At least two innocents must remain, otherwise there is no game to play.
int maxImpostorCount(int playerCount) =>
    playerCount - 2 < 1 ? 1 : playerCount - 2;

bool canStart(int playerCount, int impostorCount) {
  if (playerCount < minPlayers || playerCount > maxPlayers) return false;
  if (impostorCount < 1) return false;
  return impostorCount <= maxImpostorCount(playerCount);
}

Variant resolveVariant(VariantSetting setting, Rng rng) =>
    setting ?? (rng.next() < 0.5 ? Variant.barrani : Variant.chbih);

sealed class CreateRoundResult {
  const CreateRoundResult();
}

class RoundCreated extends CreateRoundResult {
  final Round round;
  final PairPool pool;
  const RoundCreated(this.round, this.pool);
}

class RoundExhausted extends CreateRoundResult {
  const RoundExhausted();
}

CreateRoundResult createRound(RoundConfig config, PairPool pool, Rng rng) {
  final draw = drawPair(pool, rng);
  if (draw is DrawExhausted) return const RoundExhausted();

  final ok = draw as DrawOk;
  return RoundCreated(
    Round(
      pair: ok.pair,
      variant: config.variant,
      assignments: assignRoles(config, ok.pair, rng),
      startingPlayer: rng.pickIndex(config.playerCount),
      questionTargets: assignQuestionTargets(config.playerCount, rng),
    ),
    ok.pool,
  );
}
