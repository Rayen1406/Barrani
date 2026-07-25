import type { PairPool } from "../engine/pairPool";
import type { PlayerId, Round, ScoreDelta, VariantSetting } from "../engine/types";

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
  /** offset is a step from round.startingPlayer, 0..playerCount-1 */
  | { name: "hints"; pass: 1 | 2; offset: number }
  | { name: "discussion" }
  | { name: "vote" }
  | {
      name: "resolution";
      accused: PlayerId;
      accusedWasImpostor: boolean;
      /** true while the caught impostor still owes a steal-back guess */
      stealBackPending: boolean;
      stealBackCorrect: boolean;
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
  | { type: "nextHint" }
  | { type: "endDiscussion" }
  | { type: "castVote"; accused: PlayerId }
  | { type: "resolveStealBack"; correct: boolean }
  | { type: "finishRound" }
  | { type: "nextRound" }
  | { type: "endGame" };
