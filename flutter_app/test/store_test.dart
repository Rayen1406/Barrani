import 'package:barrani/engine/types.dart';
import 'package:barrani/state/phase.dart';
import 'package:barrani/state/session.dart';
import 'package:barrani/state/store.dart';
import 'package:flutter_test/flutter_test.dart';

SessionStore storeWith(int playerCount, {int seed = 1234}) {
  final store = SessionStore(Session.initial(
    seed: seed,
    playerNames: [for (var i = 0; i < playerCount; i++) 'لاعب $i'],
    variantSetting: Variant.barrani,
    timerSeconds: null,
  ));
  return store;
}

void revealEveryone(SessionStore store) {
  for (var i = 0; i < store.session.players.length; i++) {
    store.revealCard();
    store.nextPlayer();
  }
}

void askEveryone(SessionStore store) {
  for (var i = 0; i < store.session.players.length; i++) {
    store.nextQuestion();
  }
}

void main() {
  test('a fresh session starts at home with no round', () {
    final store = storeWith(0);
    expect(store.session.phase, isA<HomePhase>());
    expect(store.session.round, isNull);
  });

  test('startRound is a no-op below the minimum table size', () {
    final store = storeWith(2);
    store.startRound();
    expect(store.session.phase, isA<HomePhase>());
  });

  test('startRound deals a round and lands on the first handoff', () {
    final store = storeWith(5)..startRound();
    expect(store.session.phase, isA<HandoffPhase>());
    expect(store.session.round!.assignments.length, 5);
  });

  test('a reveal cannot be skipped', () {
    final store = storeWith(4)..startRound();
    store.nextPlayer(); // still on handoff — must be ignored
    expect(store.session.phase, isA<HandoffPhase>());
  });

  test('after every reveal, questioning starts', () {
    final store = storeWith(4)..startRound();
    revealEveryone(store);
    expect(store.session.phase, isA<QuestionsPhase>());
    expect((store.session.phase as QuestionsPhase).offset, 0);
  });

  test('the vote is unreachable before every player has revealed', () {
    final store = storeWith(4)..startRound();
    store.revealCard();
    store.nextPlayer();
    store.castVote(0);
    expect(store.session.phase, isA<HandoffPhase>());
  });

  test('questioning goes once around the table then opens discussion', () {
    final store = storeWith(4)..startRound();
    revealEveryone(store);
    askEveryone(store);
    expect(store.session.phase, isA<DiscussionPhase>());
  });

  test('every asker gets a target, never themselves, everyone asked once', () {
    final store = storeWith(5)..startRound();
    revealEveryone(store);

    final targets = <int>[];
    for (var i = 0; i < 5; i++) {
      final asker = store.session.currentAsker;
      final target = store.session.currentTarget;
      expect(target, isNotNull);
      expect(target, isNot(asker));
      targets.add(target!);
      store.nextQuestion();
    }
    expect(targets..sort(), [0, 1, 2, 3, 4]);
  });

  test('voting out an impostor opens a pending steal-back', () {
    final store = storeWith(5)..startRound();
    revealEveryone(store);
    askEveryone(store);
    store.endDiscussion();

    final impostorId =
        store.session.round!.assignments.firstWhere((a) => a.isImpostor).playerId;
    store.castVote(impostorId);

    final phase = store.session.phase as ResolutionPhase;
    expect(phase.pending, isTrue);
    expect((phase.outcome as VoteOutcome).accusedWasImpostor, isTrue);
  });

  test('scores apply exactly once, on finishRound', () {
    final store = storeWith(5)..startRound();
    revealEveryone(store);
    askEveryone(store);
    store.endDiscussion();

    final impostorId =
        store.session.round!.assignments.firstWhere((a) => a.isImpostor).playerId;
    store.castVote(impostorId);
    store.resolveGuess(false);
    expect(store.session.scores.values.every((v) => v == 0), isTrue);

    store.finishRound();
    expect(store.session.phase, isA<ScoreboardPhase>());
    expect(store.session.scores.values.fold(0, (a, b) => a + b), 4);

    store.finishRound(); // second call must be ignored
    expect(store.session.scores.values.fold(0, (a, b) => a + b), 4);
  });

  test('البراني declaring and guessing right scores three, nobody else scores', () {
    final store = storeWith(5)..startRound();
    revealEveryone(store);
    askEveryone(store);

    final impostorId =
        store.session.round!.assignments.firstWhere((a) => a.isImpostor).playerId;
    store.openDeclare();
    store.declareGuess(impostorId);
    store.resolveGuess(true);
    store.finishRound();

    expect(store.session.scores[impostorId], 3);
    expect(store.session.scores.values.fold(0, (a, b) => a + b), 3);
  });

  test('an innocent falsely declaring hands the round to البراني', () {
    final store = storeWith(5)..startRound();
    revealEveryone(store);
    askEveryone(store);

    final round = store.session.round!;
    final innocentId = round.assignments.firstWhere((a) => !a.isImpostor).playerId;
    final impostorId = round.assignments.firstWhere((a) => a.isImpostor).playerId;

    store.openDeclare();
    store.declareGuess(innocentId);

    // No guess is owed — a false declaration is decided on the spot.
    expect((store.session.phase as ResolutionPhase).pending, isFalse);

    store.finishRound();
    expect(store.session.scores[impostorId], 2);
    expect(store.session.scores[innocentId], 0);
  });

  test('declaring can be cancelled back to discussion', () {
    final store = storeWith(5)..startRound();
    revealEveryone(store);
    askEveryone(store);
    store.openDeclare();
    store.cancelDeclare();
    expect(store.session.phase, isA<DiscussionPhase>());
  });

  test('impostor count is clamped to leave two innocents', () {
    final store = storeWith(3)..setImpostorCount(5);
    expect(store.session.impostorCount, 1);
  });

  test('endGame clears the round and scores', () {
    final store = storeWith(4)..startRound();
    revealEveryone(store);
    store.endGame();
    expect(store.session.phase, isA<HomePhase>());
    expect(store.session.round, isNull);
    expect(store.session.scores, isEmpty);
  });

  test('a blank player name is rejected and the table caps at twelve', () {
    final store = storeWith(0);
    store.addPlayer('   ');
    expect(store.session.players, isEmpty);
    for (var i = 0; i < 15; i++) {
      store.addPlayer('لاعب $i');
    }
    expect(store.session.players.length, 12);
  });
}
