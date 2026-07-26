import '../content/types.dart';
import 'rng.dart';

class PairPool {
  final List<WordPair> pairs;
  final Set<String> usedKeys;

  const PairPool({required this.pairs, required this.usedKeys});

  factory PairPool.build(Iterable<Pack> packs) => PairPool(
        pairs: [for (final pack in packs) ...pack.pairs],
        usedKeys: const {},
      );

  List<WordPair> get _available =>
      pairs.where((p) => !usedKeys.contains(p.key)).toList();

  int get remaining => _available.length;

  PairPool get recycled => PairPool(pairs: pairs, usedKeys: const {});
}

/// Exhaustion is a returned value, never a throw — the UI offers recycling.
sealed class DrawResult {
  const DrawResult();
}

class DrawOk extends DrawResult {
  final WordPair pair;
  final PairPool pool;
  const DrawOk(this.pair, this.pool);
}

class DrawExhausted extends DrawResult {
  const DrawExhausted();
}

DrawResult drawPair(PairPool pool, Rng rng) {
  final available = pool._available;
  if (available.isEmpty) return const DrawExhausted();

  final pair = available[rng.pickIndex(available.length)];
  return DrawOk(
    pair,
    PairPool(pairs: pool.pairs, usedKeys: {...pool.usedKeys, pair.key}),
  );
}
