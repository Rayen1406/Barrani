import type { WordPair } from "../content/types";

export type Variant = "barrani" | "chbih";

/** What the host chose at setup. "random" is resolved once per round. */
export type VariantSetting = Variant | "random";

export type PlayerId = number;

export type RoundConfig = {
  playerCount: number;
  impostorCount: number;
  /** Already resolved — never "random". */
  variant: Variant;
};

export type Assignment = {
  playerId: PlayerId;
  isImpostor: boolean;
  /** null only in the barrani variant, where the impostor holds no word. */
  word: string | null;
};

export type Round = {
  pair: WordPair;
  variant: Variant;
  assignments: Assignment[];
  startingPlayer: PlayerId;
};

export type RoundOutcome = {
  accused: PlayerId;
  accusedWasImpostor: boolean;
  /** Only meaningful when accusedWasImpostor is true. */
  stealBackCorrect: boolean;
};

export type ScoreDelta = Record<PlayerId, number>;
