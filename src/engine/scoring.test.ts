import { applyDelta, scoreRound } from "./scoring";
import type { Assignment, Round, RoundOutcome } from "./types";

function roundWith(impostorIds: number[], playerCount: number): Round {
  const assignments: Assignment[] = Array.from({ length: playerCount }, (_, playerId) => ({
    playerId,
    isImpostor: impostorIds.includes(playerId),
    word: impostorIds.includes(playerId) ? null : "كسكسي",
  }));
  return {
    pair: { a: "كسكسي", b: "مقرونة" },
    variant: "barrani",
    assignments,
    startingPlayer: 0,
    questionTargets: assignments.map((_, i) => (i + 1) % playerCount),
  };
}

function outcome(
  accused: number,
  accusedWasImpostor: boolean,
  stealBackCorrect = false,
): RoundOutcome {
  return { kind: "vote", accused, accusedWasImpostor, stealBackCorrect };
}

function declared(
  declarer: number,
  declarerWasImpostor: boolean,
  guessCorrect = false,
): RoundOutcome {
  return { kind: "declare", declarer, declarerWasImpostor, guessCorrect };
}

test("caught impostor, failed steal-back: every innocent scores one", () => {
  const delta = scoreRound(roundWith([2], 5), outcome(2, true, false));
  expect(delta).toEqual({ 0: 1, 1: 1, 2: 0, 3: 1, 4: 1 });
});

test("caught impostor, correct steal-back: the impostor also scores one", () => {
  const delta = scoreRound(roundWith([2], 5), outcome(2, true, true));
  expect(delta).toEqual({ 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 });
});

test("innocent accused: every impostor scores two, innocents score nothing", () => {
  const delta = scoreRound(roundWith([2], 5), outcome(3, false));
  expect(delta).toEqual({ 0: 0, 1: 0, 2: 2, 3: 0, 4: 0 });
});

test("two impostors, none caught: both score two", () => {
  const delta = scoreRound(roundWith([1, 4], 8), outcome(0, false));
  expect(delta[1]).toBe(2);
  expect(delta[4]).toBe(2);
  expect(delta[0]).toBe(0);
});

test("two impostors, one caught: the survivor gets no bonus", () => {
  const delta = scoreRound(roundWith([1, 4], 8), outcome(1, true, false));
  expect(delta[1]).toBe(0);
  expect(delta[4]).toBe(0);
  expect(delta[0]).toBe(1);
});

test("steal-back is ignored when an innocent was accused", () => {
  const withSteal = scoreRound(roundWith([2], 5), outcome(3, false, true));
  const withoutSteal = scoreRound(roundWith([2], 5), outcome(3, false, false));
  expect(withSteal).toEqual(withoutSteal);
});

test("every player appears in the delta", () => {
  const delta = scoreRound(roundWith([2], 6), outcome(2, true));
  expect(
    Object.keys(delta)
      .map(Number)
      .sort((a, b) => a - b),
  ).toEqual([0, 1, 2, 3, 4, 5]);
});

test("applyDelta accumulates across rounds and keeps absent players", () => {
  const totals = applyDelta({ 0: 3, 1: 0 }, { 0: 1, 1: 2, 2: 5 });
  expect(totals).toEqual({ 0: 4, 1: 2, 2: 5 });
});

test("applyDelta does not mutate its inputs", () => {
  const scores = { 0: 3 };
  applyDelta(scores, { 0: 1 });
  expect(scores).toEqual({ 0: 3 });
});

test("البراني declaring and guessing right scores three and nobody else scores", () => {
  const delta = scoreRound(roundWith([2], 5), declared(2, true, true));
  expect(delta).toEqual({ 0: 0, 1: 0, 2: 3, 3: 0, 4: 0 });
});

test("البراني declaring and guessing wrong hands the round to the innocents", () => {
  const delta = scoreRound(roundWith([2], 5), declared(2, true, false));
  expect(delta).toEqual({ 0: 1, 1: 1, 2: 0, 3: 1, 4: 1 });
});

test("an innocent falsely declaring hands the round to البراني", () => {
  const delta = scoreRound(roundWith([2], 5), declared(3, false));
  expect(delta).toEqual({ 0: 0, 1: 0, 2: 2, 3: 0, 4: 0 });
});

test("a false declaration rewards both impostors when there are two", () => {
  const delta = scoreRound(roundWith([1, 4], 8), declared(0, false));
  expect(delta[1]).toBe(2);
  expect(delta[4]).toBe(2);
  expect(delta[0]).toBe(0);
});

test("a correct bold guess beats merely surviving a vote", () => {
  const bold = scoreRound(roundWith([2], 5), declared(2, true, true))[2]!;
  const survived = scoreRound(roundWith([2], 5), outcome(3, false))[2]!;
  expect(bold).toBeGreaterThan(survived);
});
