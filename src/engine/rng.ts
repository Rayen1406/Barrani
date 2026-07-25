/** A deterministic source of numbers in [0, 1). Injected everywhere; never global. */
export type Rng = () => number;

/** mulberry32 — small, fast, and good enough for shuffling a party game. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickIndex(length: number, rng: Rng): number {
  return Math.floor(rng() * length);
}

/** Fisher-Yates on a copy. Never mutates the input. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, rng);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
