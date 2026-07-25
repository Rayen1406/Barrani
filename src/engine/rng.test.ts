import { createRng, pickIndex, shuffle } from "./rng";

test("the same seed produces the same sequence", () => {
  const a = createRng(42);
  const b = createRng(42);
  const seqA = Array.from({ length: 20 }, () => a());
  const seqB = Array.from({ length: 20 }, () => b());
  expect(seqA).toEqual(seqB);
});

test("different seeds produce different sequences", () => {
  const a = Array.from({ length: 20 }, createRng(1));
  const b = Array.from({ length: 20 }, createRng(2));
  expect(a).not.toEqual(b);
});

test("values stay in [0, 1)", () => {
  const rng = createRng(7);
  for (let i = 0; i < 5000; i++) {
    const value = rng();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  }
});

test("shuffle returns a permutation and does not mutate the input", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  const frozen = [...input];
  const out = shuffle(input, createRng(3));
  expect(out).toHaveLength(input.length);
  expect([...out].sort((x, y) => x - y)).toEqual(frozen);
  expect(input).toEqual(frozen);
});

test("shuffle is deterministic for a given seed", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  expect(shuffle(input, createRng(9))).toEqual(shuffle(input, createRng(9)));
});

test("shuffle actually reorders for some seed", () => {
  const input = Array.from({ length: 20 }, (_, i) => i);
  expect(shuffle(input, createRng(5))).not.toEqual(input);
});

test("pickIndex stays in range and eventually reaches every index", () => {
  const rng = createRng(11);
  const seen = new Set<number>();
  for (let i = 0; i < 2000; i++) {
    const index = pickIndex(5, rng);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(5);
    seen.add(index);
  }
  expect(seen.size).toBe(5);
});
