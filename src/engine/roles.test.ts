import { assignRoles, isImpostor } from "./roles";
import { createRng } from "./rng";
import type { Round, RoundConfig } from "./types";

const pair = { a: "كسكسي", b: "مقرونة" };

function config(
  playerCount: number,
  impostorCount: number,
  variant: RoundConfig["variant"],
): RoundConfig {
  return { playerCount, impostorCount, variant };
}

test("every player gets exactly one assignment, ids 0..n-1", () => {
  const out = assignRoles(config(6, 1, "barrani"), pair, createRng(1));
  expect(out.map((a) => a.playerId)).toEqual([0, 1, 2, 3, 4, 5]);
});

test("exactly the requested number of impostors, all distinct", () => {
  const out = assignRoles(config(9, 2, "chbih"), pair, createRng(2));
  const impostors = out.filter((a) => a.isImpostor);
  expect(impostors).toHaveLength(2);
  expect(new Set(impostors.map((a) => a.playerId)).size).toBe(2);
});

test("barrani variant: impostor holds no word, innocents share pair.a", () => {
  const out = assignRoles(config(5, 1, "barrani"), pair, createRng(3));
  for (const a of out) {
    if (a.isImpostor) expect(a.word).toBeNull();
    else expect(a.word).toBe("كسكسي");
  }
});

test("chbih variant: impostor holds pair.b, innocents share pair.a", () => {
  const out = assignRoles(config(5, 1, "chbih"), pair, createRng(3));
  for (const a of out) {
    expect(a.word).toBe(a.isImpostor ? "مقرونة" : "كسكسي");
  }
});

test("chbih with two impostors: both hold the same sibling word", () => {
  const out = assignRoles(config(8, 2, "chbih"), pair, createRng(4));
  const impostorWords = out.filter((a) => a.isImpostor).map((a) => a.word);
  expect(impostorWords).toEqual(["مقرونة", "مقرونة"]);
});

test("assignment is deterministic for a given seed", () => {
  const a = assignRoles(config(7, 2, "barrani"), pair, createRng(8));
  const b = assignRoles(config(7, 2, "barrani"), pair, createRng(8));
  expect(a).toEqual(b);
});

test("the impostor is not always player 0", () => {
  const firstImpostors = new Set<number>();
  for (let seed = 0; seed < 50; seed++) {
    const out = assignRoles(config(6, 1, "barrani"), pair, createRng(seed));
    firstImpostors.add(out.find((a) => a.isImpostor)!.playerId);
  }
  expect(firstImpostors.size).toBeGreaterThan(1);
});

test("isImpostor reads the round correctly", () => {
  const assignments = assignRoles(config(5, 1, "barrani"), pair, createRng(5));
  const round: Round = {
    pair,
    variant: "barrani",
    assignments,
    startingPlayer: 0,
    questionTargets: [
      [1, 2, 3, 4, 0],
      [2, 3, 4, 0, 1],
    ],
  };
  const impostorId = assignments.find((a) => a.isImpostor)!.playerId;
  expect(isImpostor(round, impostorId)).toBe(true);
  expect(isImpostor(round, assignments.find((a) => !a.isImpostor)!.playerId)).toBe(false);
});
