/// A deterministic source of numbers in [0, 1). Injected everywhere; never
/// global — it is what makes ten-thousand-round invariant testing possible.
class Rng {
  int _state;

  Rng(int seed) : _state = seed & 0xFFFFFFFF;

  /// mulberry32 — small, fast, and good enough for shuffling a party game.
  double next() {
    _state = (_state + 0x6d2b79f5) & 0xFFFFFFFF;
    int t = _state;
    t = (_mul32(t ^ (t >>> 15), t | 1)) & 0xFFFFFFFF;
    t = (t ^ (t + _mul32(t ^ (t >>> 7), t | 61))) & 0xFFFFFFFF;
    return ((t ^ (t >>> 14)) & 0xFFFFFFFF) / 4294967296.0;
  }

  int pickIndex(int length) => (next() * length).floor();

  /// Fisher-Yates on a copy. Never mutates the input.
  List<T> shuffle<T>(List<T> items) {
    final out = List<T>.of(items);
    for (var i = out.length - 1; i > 0; i--) {
      final j = pickIndex(i + 1);
      final tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }
}

/// Dart ints are 64-bit, so a plain `*` would not wrap the way Math.imul does.
int _mul32(int a, int b) {
  a &= 0xFFFFFFFF;
  b &= 0xFFFFFFFF;
  final aLo = a & 0xFFFF;
  final aHi = a >>> 16;
  return (aLo * b + (((aHi * b) & 0xFFFF) << 16)) & 0xFFFFFFFF;
}
