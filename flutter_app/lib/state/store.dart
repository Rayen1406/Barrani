import 'package:flutter/foundation.dart';

import '../content/packs.dart';
import '../content/types.dart';
import '../engine/pair_pool.dart';
import '../engine/rng.dart';
import '../engine/round.dart';
import '../engine/scoring.dart';
import '../engine/types.dart';
import 'phase.dart';
import 'session.dart';

/// Holds the session and is the only place a phase transition may happen.
/// Every mutation is synchronous and derived from the pure engine.
class SessionStore extends ChangeNotifier {
  Session _session;

  SessionStore(this._session);

  Session get session => _session;

  void _set(Session next) {
    if (identical(next, _session)) return;
    _session = next;
    notifyListeners();
  }

  // ---- setup ----

  void navigate(Phase to) {
    if (!isSetupPhase(_session.phase)) return;
    _set(_session.copyWith(phase: to));
  }

  void addPlayer(String rawName) {
    final name = rawName.trim();
    if (name.isEmpty || _session.players.length >= maxPlayers) return;
    final nextId = _session.players.fold<int>(-1, (m, p) => p.id > m ? p.id : m) + 1;
    _set(_session.copyWith(players: [..._session.players, Player(nextId, name)]));
  }

  void removePlayer(PlayerId id) {
    _set(_session.copyWith(
      players: _session.players.where((p) => p.id != id).toList(),
    ));
  }

  void renamePlayer(PlayerId id, String rawName) {
    final name = rawName.trim();
    if (name.isEmpty) return;
    _set(_session.copyWith(
      players: [
        for (final p in _session.players) p.id == id ? Player(p.id, name) : p,
      ],
    ));
  }

  void togglePack(String id) {
    final pack = allPacks.where((p) => p.id == id).firstOrNull;
    if (pack == null) return;
    if (pack.tier == Tier.friends && !_session.friendsUnlocked) return;

    final selected = _session.selectedPackIds.contains(id)
        ? _session.selectedPackIds.where((p) => p != id).toList()
        : [..._session.selectedPackIds, id];
    _set(_session.copyWith(selectedPackIds: selected));
  }

  void unlockFriends() => _set(_session.copyWith(friendsUnlocked: true));

  void setVariant(VariantSetting setting) => _set(setting == null
      ? _session.copyWith(clearVariant: true)
      : _session.copyWith(variantSetting: setting));

  void setImpostorCount(int count) {
    final cap = maxImpostorCount(
      _session.players.length < minPlayers ? minPlayers : _session.players.length,
    );
    _set(_session.copyWith(impostorCount: count.clamp(1, cap)));
  }

  void setTimer(int? seconds) => _set(seconds == null
      ? _session.copyWith(clearTimer: true)
      : _session.copyWith(timerSeconds: seconds));

  // ---- round ----

  /// Deals a round from the current settings. Rebuilds the pool if packs changed.
  void startRound() {
    final s = _session;
    final playerCount = s.players.length;
    if (!canStart(playerCount, s.impostorCount)) return;

    final packsChanged = s.poolPackIds.length != s.selectedPackIds.length ||
        s.poolPackIds.any((id) => !s.selectedPackIds.contains(id));

    final pool = packsChanged
        ? PairPool.build(allPacks.where((p) => s.selectedPackIds.contains(p.id)))
        : s.pool;

    final rng = Rng(s.nextSeed);
    final variant = resolveVariant(s.variantSetting, rng);
    final result = createRound(
      RoundConfig(
        playerCount: playerCount,
        impostorCount: s.impostorCount,
        variant: variant,
      ),
      pool,
      rng,
    );

    if (result is RoundExhausted) {
      _set(s.copyWith(
        pool: pool,
        poolPackIds: List.of(s.selectedPackIds),
        exhausted: true,
      ));
      return;
    }

    final ok = result as RoundCreated;
    _set(s.copyWith(
      pool: ok.pool,
      poolPackIds: List.of(s.selectedPackIds),
      round: ok.round,
      nextSeed: s.nextSeed + 1,
      exhausted: false,
      phase: const HandoffPhase(0),
    ));
  }

  void recyclePool() {
    _set(_session.copyWith(pool: _session.pool.recycled, exhausted: false));
    startRound();
  }

  void revealCard() {
    final p = _session.phase;
    if (p is! HandoffPhase) return;
    _set(_session.copyWith(phase: RevealPhase(p.index)));
  }

  void nextPlayer() {
    final p = _session.phase;
    if (p is! RevealPhase) return;
    final next = p.index + 1;
    _set(_session.copyWith(
      phase: next < _session.players.length
          ? HandoffPhase(next)
          : const QuestionsPhase(0),
    ));
  }

  void nextQuestion() {
    final p = _session.phase;
    if (p is! QuestionsPhase) return;
    final next = p.offset + 1;
    _set(_session.copyWith(
      phase: next < _session.players.length
          ? QuestionsPhase(next)
          : const DiscussionPhase(),
    ));
  }

  void endDiscussion() {
    if (_session.phase is! DiscussionPhase) return;
    _set(_session.copyWith(phase: const VotePhase()));
  }

  void openDeclare() {
    final p = _session.phase;
    if (p is! DiscussionPhase && p is! QuestionsPhase) return;
    _set(_session.copyWith(phase: const DeclarePhase()));
  }

  void cancelDeclare() {
    if (_session.phase is! DeclarePhase) return;
    _set(_session.copyWith(phase: const DiscussionPhase()));
  }

  void declareGuess(PlayerId declarer) {
    final round = _session.round;
    if (_session.phase is! DeclarePhase || round == null) return;
    final wasImpostor = round.isImpostor(declarer);
    _set(_session.copyWith(
      phase: ResolutionPhase(
        DeclareOutcome(declarer: declarer, declarerWasImpostor: wasImpostor),
        wasImpostor,
      ),
    ));
  }

  void castVote(PlayerId accused) {
    final round = _session.round;
    if (_session.phase is! VotePhase || round == null) return;
    final wasImpostor = round.isImpostor(accused);
    _set(_session.copyWith(
      phase: ResolutionPhase(
        VoteOutcome(accused: accused, accusedWasImpostor: wasImpostor),
        wasImpostor,
      ),
    ));
  }

  void resolveGuess(bool correct) {
    final p = _session.phase;
    if (p is! ResolutionPhase || !p.pending) return;
    final outcome = switch (p.outcome) {
      VoteOutcome o => o.copyWith(stealBackCorrect: correct),
      DeclareOutcome o => o.copyWith(guessCorrect: correct),
    };
    _set(_session.copyWith(phase: ResolutionPhase(outcome, false)));
  }

  void finishRound() {
    final p = _session.phase;
    final round = _session.round;
    if (p is! ResolutionPhase || p.pending || round == null) return;
    _set(_session.copyWith(
      scores: applyDelta(_session.scores, scoreRound(round, p.outcome)),
      phase: const ScoreboardPhase(),
    ));
  }

  void endGame() {
    _set(_session.copyWith(
      clearRound: true,
      scores: const {},
      exhausted: false,
      phase: const HomePhase(),
    ));
  }
}
