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
  /** questionTargets[asker] = the player that asker must question. */
  questionTargets: PlayerId[];
};

export type RoundOutcome =
  /** The table voted someone out. */
  | {
      kind: "vote";
      accused: PlayerId;
      accusedWasImpostor: boolean;
      /** Only meaningful when accusedWasImpostor is true. */
      stealBackCorrect: boolean;
    }
  /** Someone stopped the round claiming to be البراني, staking it on the word. */
  | {
      kind: "declare";
      declarer: PlayerId;
      declarerWasImpostor: boolean;
      /** Only meaningful when declarerWasImpostor is true. */
      guessCorrect: boolean;
    };

export type ScoreDelta = Record<PlayerId, number>;
