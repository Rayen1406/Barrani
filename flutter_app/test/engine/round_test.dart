import 'package:barrani/content/packs.dart';
import 'package:barrani/content/types.dart';
import 'package:barrani/engine/pair_pool.dart';
import 'package:barrani/engine/rng.dart';
import 'package:barrani/engine/round.dart';
import 'package:barrani/engine/scoring.dart';
import 'package:barrani/engine/types.dart';
import 'package:flutter_test/flutter_test.dart';

Pack packOf(String id, int count) => Pack(
      id: id,
      name: id,
      tier: Tier.family,
      emoji: '🍲',
      pairs: [
        for (var i = 0; i < count; i++) WordPair('$id-أ$i', '$id-ب$i'),
      ],
    );

void main() {
  group('pair pool', () {
    test('collects pairs from every pack given', () {
      final pool = PairPool.build([packOf('one', 3), packOf('two', 4)]);
      expect(pool.pairs.length, 7);
      expect(pool.remaining, 7);
    });

    test('an empty pool is immediately exhausted', () {
      expect(drawPair(PairPool.build([]), Rng(1)), isA<DrawExhausted>());
    });

    test('never repeats a pair until the pool is exhausted', () {
      var pool = PairPool.build([packOf('one', 30), packOf('two', 30)]);
      final rng = Rng(99);
      final seen = <String>{};

      for (var i = 0; i < 60; i++) {
        final result = drawPair(pool, rng);
        expect(result, isA<DrawOk>());
        final ok = result as DrawOk;
        expect(seen.contains(ok.pair.key), isFalse);
        seen.add(ok.pair.key);
        pool = ok.pool;
      }
      expect(drawPair(pool, rng), isA<DrawExhausted>());
    });

    test('drawing does not mutate the pool it was given', () {
      final pool = PairPool.build([packOf('one', 5)]);
      drawPair(pool, Rng(4));
      expect(pool.remaining, 5);
    });

    test('a reversed duplicate across packs is only drawable once', () {
      final a = Pack(id: 'a', name: 'a', tier: Tier.family, emoji: '🍲', pairs: const [WordPair('كسكسي', 'مقرونة')]);
      final b = Pack(id: 'b', name: 'b', tier: Tier.family, emoji: '🍲', pairs: const [WordPair('مقرونة', 'كسكسي')]);
      final first = drawPair(PairPool.build([a, b]), Rng(1)) as DrawOk;
      expect(drawPair(first.pool, Rng(1)), isA<DrawExhausted>());
    });
  });

  group('roles', () {
    const pair = WordPair('كسكسي', 'مقرونة');

    test('barrani: impostor holds no word, innocents share pair.a', () {
      final out = assignRoles(
        const RoundConfig(playerCount: 5, impostorCount: 1, variant: Variant.barrani),
        pair,
        Rng(3),
      );
      for (final a in out) {
        expect(a.word, a.isImpostor ? isNull : 'كسكسي');
      }
    });

    test('chbih: impostor holds pair.b, innocents share pair.a', () {
      final out = assignRoles(
        const RoundConfig(playerCount: 5, impostorCount: 1, variant: Variant.chbih),
        pair,
        Rng(3),
      );
      for (final a in out) {
        expect(a.word, a.isImpostor ? 'مقرونة' : 'كسكسي');
      }
    });

    test('exactly the requested number of impostors, all distinct', () {
      final out = assignRoles(
        const RoundConfig(playerCount: 9, impostorCount: 2, variant: Variant.chbih),
        pair,
        Rng(2),
      );
      final impostors = out.where((a) => a.isImpostor).toList();
      expect(impostors.length, 2);
      expect(impostors.map((a) => a.playerId).toSet().length, 2);
    });

    test('the impostor is not always player 0', () {
      final seen = <int>{};
      for (var seed = 0; seed < 50; seed++) {
        final out = assignRoles(
          const RoundConfig(playerCount: 6, impostorCount: 1, variant: Variant.barrani),
          pair,
          Rng(seed),
        );
        seen.add(out.firstWhere((a) => a.isImpostor).playerId);
      }
      expect(seen.length, greaterThan(1));
    });
  });

  group('question targets', () {
    test('there are two passes around the table', () {
      expect(questionPasses, 2);
      expect(assignQuestionTargets(5, Rng(1)).length, 2);
    });

    test('nobody is sent to question themselves, in any pass', () {
      for (var count = 3; count <= 12; count++) {
        for (var seed = 0; seed < 40; seed++) {
          for (final pass in assignQuestionTargets(count, Rng(seed))) {
            for (var asker = 0; asker < pass.length; asker++) {
              expect(pass[asker], isNot(asker));
            }
          }
        }
      }
    });

    test('every player is questioned exactly once per pass', () {
      for (var count = 3; count <= 12; count++) {
        for (final pass in assignQuestionTargets(count, Rng(count))) {
          expect(List.of(pass)..sort(), List.generate(count, (i) => i));
        }
      }
    });

    test('a table too small to pair returns empty passes', () {
      expect(assignQuestionTargets(1, Rng(1)), [[], []]);
    });
  });

  group('setup rules', () {
    test('suggests one impostor up to six players, two from seven', () {
      expect([3, 4, 5, 6].map(suggestImpostorCount), [1, 1, 1, 1]);
      expect([7, 8, 12].map(suggestImpostorCount), [2, 2, 2]);
    });

    test('canStart rejects impossible tables', () {
      expect(canStart(2, 1), isFalse);
      expect(canStart(13, 1), isFalse);
      expect(canStart(3, 0), isFalse);
      expect(canStart(3, 2), isFalse);
      expect(canStart(3, 1), isTrue);
      expect(canStart(12, 2), isTrue);
    });

    test('random variant produces both over many seeds', () {
      final seen = {
        for (var seed = 0; seed < 60; seed++) resolveVariant(null, Rng(seed)),
      };
      expect(seen, {Variant.barrani, Variant.chbih});
    });
  });

  group('invariants across ten thousand rounds', () {
    test('roles, words and scoring all hold', () {
      final pool = PairPool.build(allPacks);
      const variants = [Variant.barrani, Variant.chbih];

      for (var i = 0; i < 10000; i++) {
        final playerCount = minPlayers + (i % (maxPlayers - minPlayers + 1));
        final variant = variants[i % variants.length];
        final impostorCount = 1 + (i % maxImpostorCount(playerCount));

        expect(canStart(playerCount, impostorCount), isTrue);

        final result = createRound(
          RoundConfig(
            playerCount: playerCount,
            impostorCount: impostorCount,
            variant: variant,
          ),
          pool,
          Rng(i),
        );
        expect(result, isA<RoundCreated>());
        final round = (result as RoundCreated).round;

        expect(round.assignments.length, playerCount);
        final impostors = round.assignments.where((a) => a.isImpostor).toList();
        final innocents = round.assignments.where((a) => !a.isImpostor).toList();

        expect(impostors.length, impostorCount);
        expect(innocents.length, greaterThanOrEqualTo(2));

        for (final innocent in innocents) {
          expect(innocent.word, round.pair.a);
        }
        for (final impostor in impostors) {
          expect(impostor.word, variant == Variant.chbih ? round.pair.b : null);
        }

        expect(round.startingPlayer, inInclusiveRange(0, playerCount - 1));

        // Nobody questions themselves; everyone is questioned once per pass.
        expect(round.questionTargets.length, questionPasses);
        for (final pass in round.questionTargets) {
          for (var asker = 0; asker < pass.length; asker++) {
            expect(pass[asker], isNot(asker));
          }
          expect(List.of(pass)..sort(), List.generate(playerCount, (i) => i));
        }

        final caughtId = impostors.first.playerId;
        final innocentId = innocents.first.playerId;
        int sum(ScoreDelta d) => d.values.fold(0, (a, b) => a + b);

        expect(
          sum(scoreRound(round, VoteOutcome(accused: caughtId, accusedWasImpostor: true))),
          innocents.length,
        );
        expect(
          sum(scoreRound(round, VoteOutcome(accused: caughtId, accusedWasImpostor: true, stealBackCorrect: true))),
          innocents.length + 1,
        );
        expect(
          sum(scoreRound(round, VoteOutcome(accused: innocentId, accusedWasImpostor: false))),
          2 * impostorCount,
        );
        expect(
          sum(scoreRound(round, DeclareOutcome(declarer: caughtId, declarerWasImpostor: true, guessCorrect: true))),
          3,
        );
        expect(
          sum(scoreRound(round, DeclareOutcome(declarer: innocentId, declarerWasImpostor: false))),
          2 * impostorCount,
        );
      }
    });

    test('the shipped content drains without repeating', () {
      var pool = PairPool.build(allPacks);
      final rng = Rng(1234);
      final seen = <String>{};
      final total = allPacks.fold<int>(0, (sum, p) => sum + p.pairs.length);

      for (var i = 0; i < total; i++) {
        final draw = createRound(
          const RoundConfig(playerCount: 5, impostorCount: 1, variant: Variant.barrani),
          pool,
          rng,
        );
        expect(draw, isA<RoundCreated>());
        final ok = draw as RoundCreated;
        expect(seen.contains(ok.round.pair.key), isFalse);
        seen.add(ok.round.pair.key);
        pool = ok.pool;
      }

      expect(
        createRound(
          const RoundConfig(playerCount: 5, impostorCount: 1, variant: Variant.barrani),
          pool,
          rng,
        ),
        isA<RoundExhausted>(),
      );
    });
  });
}
