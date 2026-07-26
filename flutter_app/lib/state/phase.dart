import '../engine/types.dart';

sealed class Phase {
  const Phase();
}

class HomePhase extends Phase {
  const HomePhase();
}

class PlayersPhase extends Phase {
  const PlayersPhase();
}

class PacksPhase extends Phase {
  const PacksPhase();
}

class OptionsPhase extends Phase {
  const OptionsPhase();
}

class RulesPhase extends Phase {
  const RulesPhase();
}

/// index is a seat, 0..playerCount-1
class HandoffPhase extends Phase {
  final int index;
  const HandoffPhase(this.index);
}

class RevealPhase extends Phase {
  final int index;
  const RevealPhase(this.index);
}

/// offset is a step from round.startingPlayer, 0..playerCount-1
class QuestionsPhase extends Phase {
  final int offset;
  const QuestionsPhase(this.offset);
}

class DiscussionPhase extends Phase {
  const DiscussionPhase();
}

/// Someone claims to be البراني and is about to stake the round on the word.
class DeclarePhase extends Phase {
  const DeclarePhase();
}

class VotePhase extends Phase {
  const VotePhase();
}

class ResolutionPhase extends Phase {
  final RoundOutcome outcome;

  /// true while an impostor still owes a spoken guess
  final bool pending;

  const ResolutionPhase(this.outcome, this.pending);
}

class ScoreboardPhase extends Phase {
  const ScoreboardPhase();
}

bool isSetupPhase(Phase phase) =>
    phase is HomePhase ||
    phase is PlayersPhase ||
    phase is PacksPhase ||
    phase is OptionsPhase ||
    phase is RulesPhase;
