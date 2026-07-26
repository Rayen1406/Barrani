import { assignQuestionTargets, QUESTION_PASSES } from "./questions";
import { createRng } from "./rng";

test("there are two passes around the table", () => {
  expect(QUESTION_PASSES).toBe(2);
  expect(assignQuestionTargets(5, createRng(1))).toHaveLength(2);
});

test("nobody is sent to question themselves, in any pass", () => {
  for (let count = 3; count <= 12; count++) {
    for (let seed = 0; seed < 40; seed++) {
      for (const pass of assignQuestionTargets(count, createRng(seed))) {
        pass.forEach((target, asker) => expect(target).not.toBe(asker));
      }
    }
  }
});

test("every player is questioned exactly once per pass", () => {
  for (let count = 3; count <= 12; count++) {
    for (const pass of assignQuestionTargets(count, createRng(count))) {
      expect([...pass].sort((a, b) => a - b)).toEqual(
        Array.from({ length: count }, (_, i) => i),
      );
    }
  }
});

test("there is one target per player in each pass", () => {
  for (const pass of assignQuestionTargets(5, createRng(1))) {
    expect(pass).toHaveLength(5);
  }
});

test("targets are deterministic for a given seed", () => {
  expect(assignQuestionTargets(7, createRng(9))).toEqual(
    assignQuestionTargets(7, createRng(9)),
  );
});

test("the two passes generally pair people up differently", () => {
  // Drawn independently, so identical passes should be rare rather than the rule.
  let identical = 0;
  for (let seed = 0; seed < 40; seed++) {
    const [first, second] = assignQuestionTargets(6, createRng(seed));
    if (first!.join(",") === second!.join(",")) identical += 1;
  }
  expect(identical).toBeLessThan(10);
});

test("targets actually vary across seeds", () => {
  const shapes = new Set(
    Array.from({ length: 30 }, (_, seed) =>
      assignQuestionTargets(6, createRng(seed))[0]!.join(","),
    ),
  );
  expect(shapes.size).toBeGreaterThan(1);
});

test("a table too small to pair returns empty passes", () => {
  expect(assignQuestionTargets(1, createRng(1))).toEqual([[], []]);
  expect(assignQuestionTargets(0, createRng(1))).toEqual([[], []]);
});
