import 'package:flutter/material.dart';

import '../engine/round.dart';
import '../engine/types.dart';
import '../state/phase.dart';
import '../state/store.dart';
import '../strings.dart';
import '../theme.dart';
import 'widgets.dart';

class HandoffScreen extends StatelessWidget {
  final SessionStore store;
  final int index;
  const HandoffScreen(this.store, this.index, {super.key});

  @override
  Widget build(BuildContext context) {
    final players = store.session.players;
    if (index >= players.length) return const SizedBox.shrink();
    final player = players[index];

    return Screen(
      centered: true,
      children: [
        const Text(S.handoffTo,
            textAlign: TextAlign.center, style: TextStyle(color: C.textDim, fontSize: 17)),
        const SizedBox(height: 8),
        Text(player.name,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 38, fontWeight: FontWeight.w700, color: C.text)),
        const SizedBox(height: 24),
        Btn('${S.iAm} ${player.name}', onPressed: store.revealCard),
      ],
    );
  }
}

class RevealScreen extends StatelessWidget {
  final SessionStore store;
  final int index;
  const RevealScreen(this.store, this.index, {super.key});

  @override
  Widget build(BuildContext context) {
    final round = store.session.round;
    if (round == null || index >= round.assignments.length) {
      return const SizedBox.shrink();
    }
    final assignment = round.assignments[index];

    return Screen(
      centered: true,
      children: [
        HoldToReveal(
          builder: (context) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (assignment.word == null)
                const WordCard(
                    title: S.youAreBarrani, hint: S.barraniHint, impostor: true)
              else
                WordCard(label: S.yourWord, title: assignment.word!),
              const SizedBox(height: 16),
              Btn(S.next, variant: BtnVariant.ghost, onPressed: store.nextPlayer),
            ],
          ),
        ),
      ],
    );
  }
}

class QuestionsScreen extends StatelessWidget {
  final SessionStore store;
  final int pass;
  const QuestionsScreen(this.store, this.pass, {super.key});

  @override
  Widget build(BuildContext context) {
    final s = store.session;
    final asker = s.playerById(s.currentAsker ?? -1);
    final target = s.playerById(s.currentTarget ?? -1);

    return Screen(
      centered: true,
      children: [
        Text('${S.passLabel} ${pass + 1} / $questionPasses',
            textAlign: TextAlign.center,
            style: const TextStyle(color: C.textDim, fontSize: 17)),
        const SizedBox(height: 8),
        const Text(S.turnOf,
            textAlign: TextAlign.center, style: TextStyle(color: C.textDim, fontSize: 17)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: C.surface,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              Text(asker?.name ?? '',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 32, fontWeight: FontWeight.w700, color: C.text)),
              const SizedBox(height: 4),
              const Text(S.asks, style: TextStyle(color: C.textDim, fontSize: 17)),
              const SizedBox(height: 4),
              Text(target?.name ?? '',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 32, fontWeight: FontWeight.w700, color: C.accent)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(S.questionHint,
            textAlign: TextAlign.center,
            style: TextStyle(color: C.textDim, fontSize: 16, height: 1.5)),
        const SizedBox(height: 16),
        Btn(S.asked, onPressed: store.nextQuestion),
        Btn(S.wantsToGuess, variant: BtnVariant.ghost, onPressed: store.openDeclare),
      ],
    );
  }
}

class DiscussionScreen extends StatelessWidget {
  final SessionStore store;
  const DiscussionScreen(this.store, {super.key});

  @override
  Widget build(BuildContext context) {
    final seconds = store.session.timerSeconds;

    return Screen(
      centered: true,
      children: [
        const Text(S.discussionTitle,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: C.text)),
        const SizedBox(height: 20),
        if (seconds != null)
          CountdownTimer(seconds: seconds, onComplete: store.endDiscussion),
        const SizedBox(height: 20),
        Btn(S.startVote, onPressed: store.endDiscussion),
        Btn(S.wantsToGuess, variant: BtnVariant.ghost, onPressed: store.openDeclare),
      ],
    );
  }
}

class DeclareScreen extends StatelessWidget {
  final SessionStore store;
  const DeclareScreen(this.store, {super.key});

  @override
  Widget build(BuildContext context) {
    return Screen(
      children: [
        const Text(S.declareTitle,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: C.text)),
        const SizedBox(height: 8),
        const Text(S.declareWarning,
            textAlign: TextAlign.center,
            style: TextStyle(color: C.secondary, fontWeight: FontWeight.w700, height: 1.5)),
        const SizedBox(height: 16),
        for (final p in store.session.players)
          Btn(p.name,
              variant: BtnVariant.ghost, onPressed: () => store.declareGuess(p.id)),
        const SizedBox(height: 8),
        Btn(S.backToDiscussion,
            variant: BtnVariant.ghost, onPressed: store.cancelDeclare),
      ],
    );
  }
}

class VoteScreen extends StatelessWidget {
  final SessionStore store;
  const VoteScreen(this.store, {super.key});

  @override
  Widget build(BuildContext context) {
    return Screen(
      children: [
        const Text(S.voteTitle,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 30, fontWeight: FontWeight.w700, color: C.text)),
        const SizedBox(height: 16),
        for (final p in store.session.players)
          Btn(p.name, variant: BtnVariant.ghost, onPressed: () => store.castVote(p.id)),
      ],
    );
  }
}

class ResolutionScreen extends StatelessWidget {
  final SessionStore store;
  final ResolutionPhase phase;
  const ResolutionScreen(this.store, this.phase, {super.key});

  @override
  Widget build(BuildContext context) {
    final s = store.session;
    final round = s.round;
    if (round == null) return const SizedBox.shrink();

    if (phase.pending) {
      final isDeclaration = phase.outcome is DeclareOutcome;
      final who = switch (phase.outcome) {
        DeclareOutcome o => s.playerById(o.declarer)?.name,
        VoteOutcome o => s.playerById(o.accused)?.name,
      };
      return Screen(
        centered: true,
        children: [
          _Verdict(isDeclaration ? S.wantsToGuess : S.caught, won: false),
          Text(who ?? '',
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 26, fontWeight: FontWeight.w700, color: C.text)),
          const SizedBox(height: 8),
          if (!isDeclaration)
            const Text(S.stealBackPrompt,
                textAlign: TextAlign.center,
                style: TextStyle(color: C.textDim, fontSize: 16)),
          const SizedBox(height: 6),
          const Text(S.sayTheWord,
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: C.secondary, fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          Btn(S.guessedRight, onPressed: () => store.resolveGuess(true)),
          Btn(S.guessedWrong,
              variant: BtnVariant.ghost, onPressed: () => store.resolveGuess(false)),
        ],
      );
    }

    final impostorNames = s.players
        .where((p) => round.isImpostor(p.id))
        .map((p) => p.name)
        .join(' و ');

    final (headline, barraniWon) = switch (phase.outcome) {
      VoteOutcome o => o.accusedWasImpostor ? (S.caught, false) : (S.missed, true),
      DeclareOutcome o => !o.declarerWasImpostor
          ? (S.notBarrani, true)
          : (o.guessCorrect ? (S.boldWin) : (S.boldFail), o.guessCorrect),
    };

    return Screen(
      centered: true,
      children: [
        _Verdict(headline, won: barraniWon),
        if (phase.outcome is DeclareOutcome &&
            !(phase.outcome as DeclareOutcome).declarerWasImpostor)
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: Text(S.tableBlundered,
                textAlign: TextAlign.center,
                style: TextStyle(color: C.secondary, fontWeight: FontWeight.w700)),
          ),
        const SizedBox(height: 16),
        const Text(S.barraniWas,
            textAlign: TextAlign.center, style: TextStyle(color: C.textDim, fontSize: 16)),
        Text(impostorNames,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: C.text)),
        const SizedBox(height: 16),
        Text(round.variant == Variant.chbih ? S.groupWordWas : S.secretWordWas,
            textAlign: TextAlign.center,
            style: const TextStyle(color: C.textDim, fontSize: 16)),
        Text(round.pair.a,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 38, fontWeight: FontWeight.w700, color: C.accent)),
        const SizedBox(height: 20),
        Btn(S.scores, onPressed: store.finishRound),
      ],
    );
  }
}

class _Verdict extends StatelessWidget {
  final String text;
  final bool won;
  const _Verdict(this.text, {required this.won});

  @override
  Widget build(BuildContext context) => Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 34,
          fontWeight: FontWeight.w700,
          height: 1.2,
          color: won ? C.danger : C.accent,
        ),
      );
}

class ScoreboardScreen extends StatelessWidget {
  final SessionStore store;
  const ScoreboardScreen(this.store, {super.key});

  @override
  Widget build(BuildContext context) {
    final s = store.session;
    final ranked = [...s.players]
      ..sort((a, b) => (s.scores[b.id] ?? 0).compareTo(s.scores[a.id] ?? 0));

    return Screen(
      children: [
        const Text(S.scores,
            style: TextStyle(fontSize: 30, fontWeight: FontWeight.w700, color: C.text)),
        const SizedBox(height: 16),
        if (s.exhausted) ...[
          const Text(S.exhausted,
              textAlign: TextAlign.center,
              style: TextStyle(color: C.secondary, fontWeight: FontWeight.w700)),
          Btn(S.recycle, onPressed: store.recyclePool),
        ],
        for (final p in ranked)
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: C.surface,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(p.name, style: const TextStyle(fontSize: 18, color: C.text)),
                Text('${s.scores[p.id] ?? 0}',
                    style: const TextStyle(
                        fontSize: 24, fontWeight: FontWeight.w700, color: C.accent)),
              ],
            ),
          ),
        const SizedBox(height: 8),
        Btn(S.nextRound, onPressed: store.startRound),
        Btn(S.endGame, variant: BtnVariant.ghost, onPressed: store.endGame),
      ],
    );
  }
}
