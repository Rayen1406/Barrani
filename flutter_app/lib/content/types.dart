enum Tier { family, friends }

class WordPair {
  final String a;
  final String b;
  const WordPair(this.a, this.b);

  /// Order-independent identity, so a/b reversed counts as the same pair.
  String get key {
    final sorted = [a, b]..sort();
    return sorted.join('|');
  }

  @override
  bool operator ==(Object other) =>
      other is WordPair && other.a == a && other.b == b;

  @override
  int get hashCode => Object.hash(a, b);
}

class Pack {
  final String id;
  final String name;
  final Tier tier;
  final String emoji;
  final List<WordPair> pairs;

  const Pack({
    required this.id,
    required this.name,
    required this.tier,
    required this.emoji,
    required this.pairs,
  });
}
