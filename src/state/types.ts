import type { PairPool } from "../engine/pairPool";
import type { PlayerId, Round, RoundOutcome, ScoreDelta, VariantSetting } from "../engine/types";

export type Player = { id: PlayerId; name: string };

export type Phase =
  | { name: "home" }
  | { name: "players" }
  | { name: "packs" }
  | { name: "options" }
  | { name: "rules" }
  /** index is a seat, 0..playerCount-1 */
  | { name: "handoff"; index: number }
  | { name: "reveal"; index: number }
  /** pass is 0-based; offset is a step from round.startingPlayer */
  | { name: "questions"; pass: number; offset: number }
  | { name: "discussion" }
  /** Someone claims to be البراني and is about to stake the round on the word. */
  | { name: "declare" }
  | { name: "vote" }
  | {
      name: "resolution";
      outcome: RoundOutcome;
      /** true while an impostor still owes a spoken guess */
      pending: boolean;
    }
  | { name: "scoreboard" };

export type SetupPhaseName = "home" | "players" | "packs" | "options" | "rules";

export type Session = {
  players: Player[];
  selectedPackIds: string[];
  friendsUnlocked: boolean;
  variantSetting: VariantSetting;
  impostorCount: number;
  timerSeconds: number | null;
  /** Consumed and incremented on every round, keeping the reducer pure. */
  nextSeed: number;
  pool: PairPool;
  /** Which pack selection the pool was built from, so it rebuilds when that changes. */
  poolPackIds: string[];
  round: Round | null;
  scores: ScoreDelta;
  phase: Phase;
  /** Set when the pack selection ran out of unused pairs. */
  exhausted: boolean;
};

export type Action =
  | { type: "navigate"; to: SetupPhaseName }
  | { type: "addPlayer"; name: string }
  | { type: "renamePlayer"; id: PlayerId; name: string }
  | { type: "removePlayer"; id: PlayerId }
  | { type: "togglePack"; id: string }
  | { type: "unlockFriends" }
  | { type: "setVariant"; setting: VariantSetting }
  | { type: "setImpostorCount"; count: number }
  | { type: "setTimer"; seconds: number | null }
  | { type: "startRound" }
  | { type: "recyclePool" }
  | { type: "revealCard" }
  | { type: "nextPlayer" }
  | { type: "nextQuestion" }
  | { type: "endDiscussion" }
  | { type: "openDeclare" }
  | { type: "cancelDeclare" }
  | { type: "declareGuess"; declarer: PlayerId }
  | { type: "castVote"; accused: PlayerId }
  | { type: "resolveGuess"; correct: boolean }
  | { type: "finishRound" }
  | { type: "nextRound" }
  | { type: "endGame" };
