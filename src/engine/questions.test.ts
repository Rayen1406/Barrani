import { assignQuestionTargets } from "./questions";
import { createRng } from "./rng";

test("nobody is sent to question themselves", () => {
  for (let count = 3; count <= 12; count++) {
    for (let seed = 0; seed < 40; seed++) {
      const targets = assignQuestionTargets(count, createRng(seed));
      targets.forEach((target, asker) => expect(target).not.toBe(asker));
    }
  }
});

test("every player is questioned exactly once", () => {
  for (let count = 3; count <= 12; count++) {
    const targets = assignQuestionTargets(count, createRng(count));
    expect([...targets].sort((a, b) => a - b)).toEqual(
      Array.from({ length: count }, (_, i) => i),
    );
  }
});

test("there is one target per player", () => {
  expect(assignQuestionTargets(5, createRng(1))).toHaveLength(5);
});

test("targets are deterministic for a given seed", () => {
  expect(assignQuestionTargets(7, createRng(9))).toEqual(assignQuestionTargets(7, createRng(9)));
});

test("targets actually vary across seeds", () => {
  const shapes = new Set(
    Array.from({ length: 30 }, (_, seed) => assignQuestionTargets(6, createRng(seed)).join(",")),
  );
  expect(shapes.size).toBeGreaterThan(1);
});

test("a table too small to pair returns nothing", () => {
  expect(assignQuestionTargets(1, createRng(1))).toEqual([]);
  expect(assignQuestionTargets(0, createRng(1))).toEqual([]);
});
