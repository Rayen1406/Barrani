import { defaultSettings } from "../persist/schema";
import { createSession, currentAsker, currentTarget, reducer } from "./reducer";
import type { Action, Session } from "./types";

function sessionWith(playerCount: number): Session {
  let session = createSession({ ...defaultSettings, impostorCount: 1 }, 1234);
  for (let i = 0; i < playerCount; i++) {
    session = reducer(session, { type: "addPlayer", name: `لاعب ${i}` });
  }
  return session;
}

/** Walks handoff -> reveal for every seat, ending on the hints phase. */
function revealEveryone(session: Session): Session {
  let out = session;
  for (let i = 0; i < out.players.length; i++) {
    out = reducer(out, { type: "revealCard" });
    out = reducer(out, { type: "nextPlayer" });
  }
  return out;
}

function reachVote(playerCount: number): Session {
  let session = revealEveryone(reducer(sessionWith(playerCount), { type: "startRound" }));
  for (let i = 0; i < playerCount; i++) session = reducer(session, { type: "nextQuestion" });
  return reducer(session, { type: "endDiscussion" });
}

test("a fresh session starts at home with no players", () => {
  const session = createSession(defaultSettings, 1);
  expect(session.phase).toEqual({ name: "home" });
  expect(session.players).toEqual([]);
  expect(session.round).toBeNull();
});

test("players can be added, renamed, and removed", () => {
  let session = sessionWith(3);
  expect(session.players.map((p) => p.name)).toEqual(["لاعب 0", "لاعب 1", "لاعب 2"]);
  session = reducer(session, { type: "renamePlayer", id: session.players[1]!.id, name: "أمين" });
  expect(session.players[1]!.name).toBe("أمين");
  session = reducer(session, { type: "removePlayer", id: session.players[0]!.id });
  expect(session.players.map((p) => p.name)).toEqual(["أمين", "لاعب 2"]);
});

test("adding beyond the maximum table size is a no-op", () => {
  let session = sessionWith(12);
  const before = session.players.length;
  session = reducer(session, { type: "addPlayer", name: "زايد" });
  expect(session.players.length).toBe(before);
});

test("a blank player name is rejected", () => {
  const session = sessionWith(2);
  expect(reducer(session, { type: "addPlayer", name: "   " })).toBe(session);
});

test("startRound is a no-op below the minimum table size", () => {
  const session = sessionWith(2);
  expect(reducer(session, { type: "startRound" })).toBe(session);
});

test("startRound deals a round and lands on the first handoff", () => {
  const session = reducer(sessionWith(5), { type: "startRound" });
  expect(session.phase).toEqual({ name: "handoff", index: 0 });
  expect(session.round?.assignments).toHaveLength(5);
});

test("startRound consumes the seed so consecutive rounds differ", () => {
  const first = reducer(sessionWith(5), { type: "startRound" });
  const second = reducer(first, { type: "startRound" });
  expect(second.nextSeed).not.toBe(first.nextSeed);
});

test("reveal then nextPlayer walks every seat before hints begin", () => {
  let session = reducer(sessionWith(4), { type: "startRound" });
  session = reducer(session, { type: "revealCard" });
  expect(session.phase).toEqual({ name: "reveal", index: 0 });
  session = reducer(session, { type: "nextPlayer" });
  expect(session.phase).toEqual({ name: "handoff", index: 1 });
});

test("after the last seat reveals, questioning starts at offset zero", () => {
  const session = revealEveryone(reducer(sessionWith(4), { type: "startRound" }));
  expect(session.phase).toEqual({ name: "questions", offset: 0 });
});

test("a reveal cannot be skipped — nextPlayer during handoff is a no-op", () => {
  const session = reducer(sessionWith(4), { type: "startRound" });
  expect(reducer(session, { type: "nextPlayer" })).toBe(session);
});

test("the vote is unreachable before every player has revealed", () => {
  let session = reducer(sessionWith(4), { type: "startRound" });
  session = reducer(session, { type: "revealCard" });
  session = reducer(session, { type: "nextPlayer" });
  expect(reducer(session, { type: "castVote", accused: 0 })).toBe(session);
  expect(reducer(session, { type: "endDiscussion" })).toBe(session);
});

test("questioning goes once around the table then opens discussion", () => {
  let session = revealEveryone(reducer(sessionWith(3), { type: "startRound" }));
  for (let i = 0; i < 2; i++) session = reducer(session, { type: "nextQuestion" });
  expect(session.phase).toEqual({ name: "questions", offset: 2 });
  session = reducer(session, { type: "nextQuestion" });
  expect(session.phase).toEqual({ name: "discussion" });
});

test("the asking turn walks the table starting from the round's starting player", () => {
  const session = revealEveryone(reducer(sessionWith(4), { type: "startRound" }));
  expect(currentAsker(session)).toBe(session.round!.startingPlayer);
  const next = reducer(session, { type: "nextQuestion" });
  expect(currentAsker(next)).toBe((session.round!.startingPlayer + 1) % 4);
});

test("every asker gets a target, and never themselves", () => {
  let session = revealEveryone(reducer(sessionWith(5), { type: "startRound" }));
  const seen: number[] = [];
  for (let i = 0; i < 5; i++) {
    const asker = currentAsker(session);
    const target = currentTarget(session);
    expect(target).not.toBeNull();
    expect(target).not.toBe(asker);
    seen.push(target!);
    session = reducer(session, { type: "nextQuestion" });
  }
  expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
});

test("voting out an impostor opens a pending steal-back", () => {
  const atVote = reachVote(5);
  const impostorId = atVote.round!.assignments.find((a) => a.isImpostor)!.playerId;
  const session = reducer(atVote, { type: "castVote", accused: impostorId });
  expect(session.phase).toMatchObject({
    name: "resolution",
    accusedWasImpostor: true,
    stealBackPending: true,
  });
});

test("voting out an innocent skips the steal-back entirely", () => {
  const atVote = reachVote(5);
  const innocentId = atVote.round!.assignments.find((a) => !a.isImpostor)!.playerId;
  const session = reducer(atVote, { type: "castVote", accused: innocentId });
  expect(session.phase).toMatchObject({
    name: "resolution",
    accusedWasImpostor: false,
    stealBackPending: false,
  });
});

test("finishRound is blocked while a steal-back is pending", () => {
  const atVote = reachVote(5);
  const impostorId = atVote.round!.assignments.find((a) => a.isImpostor)!.playerId;
  const session = reducer(atVote, { type: "castVote", accused: impostorId });
  expect(reducer(session, { type: "finishRound" })).toBe(session);
});

test("scores are applied exactly once, on finishRound", () => {
  const atVote = reachVote(5);
  const impostorId = atVote.round!.assignments.find((a) => a.isImpostor)!.playerId;
  let session = reducer(atVote, { type: "castVote", accused: impostorId });
  session = reducer(session, { type: "resolveStealBack", correct: false });
  expect(session.scores).toEqual({});

  session = reducer(session, { type: "finishRound" });
  expect(session.phase).toEqual({ name: "scoreboard" });
  expect(Object.values(session.scores).reduce((a, b) => a + b, 0)).toBe(4);

  const again = reducer(session, { type: "finishRound" });
  expect(again).toBe(session);
});

test("deselecting every pack makes the next round report exhaustion", () => {
  let session = sessionWith(5);
  for (const id of [...session.selectedPackIds]) {
    session = reducer(session, { type: "togglePack", id });
  }
  expect(session.selectedPackIds).toEqual([]);
  session = reducer(session, { type: "startRound" });
  expect(session.exhausted).toBe(true);
  expect(session.round).toBeNull();
});

test("toggling an unknown pack id is a no-op", () => {
  const session = sessionWith(5);
  expect(reducer(session, { type: "togglePack", id: "does-not-exist" })).toBe(session);
});

test("impostor count is clamped to leave two innocents", () => {
  const session = reducer(sessionWith(3), { type: "setImpostorCount", count: 5 });
  expect(session.impostorCount).toBe(1);
});

test("navigation is ignored once a round is in progress", () => {
  const session = reducer(sessionWith(4), { type: "startRound" });
  expect(reducer(session, { type: "navigate", to: "players" })).toBe(session);
});

test("endGame clears the round and scores and returns home", () => {
  let session = revealEveryone(reducer(sessionWith(4), { type: "startRound" }));
  session = reducer(session, { type: "endGame" });
  expect(session.phase).toEqual({ name: "home" });
  expect(session.round).toBeNull();
  expect(session.scores).toEqual({});
});

test("unknown-for-this-phase actions never throw and never change identity", () => {
  const session = sessionWith(4);
  const noops: Action[] = [
    { type: "revealCard" },
    { type: "nextPlayer" },
    { type: "nextQuestion" },
    { type: "endDiscussion" },
    { type: "castVote", accused: 0 },
    { type: "resolveStealBack", correct: true },
    { type: "finishRound" },
  ];
  for (const action of noops) expect(reducer(session, action)).toBe(session);
});
