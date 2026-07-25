export type Tier = "family" | "friends";

export type WordPair = { a: string; b: string };

export type Pack = {
  id: string;
  name: string;
  tier: Tier;
  emoji: string;
  pairs: WordPair[];
};

export const MIN_PAIRS_PER_PACK = 25;
export const MAX_WORD_LENGTH = 22;
