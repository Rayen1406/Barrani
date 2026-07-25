import { allPacks } from "../content";
import { buildPool, recyclePool } from "../engine/pairPool";
import { createRng } from "../engine/rng";
import { MAX_PLAYERS, MIN_PLAYERS } from "../engine/roles";
import { canStart, createRound, maxImpostorCount, resolveVariant } from "../engine/round";
import { applyDelta, scoreRound } from "../engine/scoring";
import type { PlayerId } from "../engine/types";
import type { PersistedSettings } from "../persist/schema";
import type { Action, Phase, Player, Session } from "./types";

const SETUP_PHASES = ["home", "players", "packs", "options", "rules"];

function packById(id: string) {
  return allPacks.find((pack) => pack.id === id);
}

function poolFor(packIds: readonly string[]) {
  return buildPool(allPacks.filter((pack) => packIds.includes(pack.id)));
}

export function createSession(settings: PersistedSettings, seed: number): Session {
  return {
    players: settings.playerNames.map((name, id) => ({ id, name })),
    selectedPackIds: [...settings.selectedPackIds],
    friendsUnlocked: settings.friendsUnlocked,
    variantSetting: settings.variantSetting,
    impostorCount: settings.impostorCount,
    timerSeconds: settings.timerSeconds,
    nextSeed: seed,
    pool: poolFor(settings.selectedPackIds),
    poolPackIds: [...settings.selectedPackIds],
    round: null,
    scores: {},
    phase: { name: "home" },
    exhausted: false,
  };
}

export function currentHintPlayer(session: Session): PlayerId | null {
  if (session.phase.name !== "hints" || !session.round) return null;
  const count = session.players.length;
  if (count === 0) return null;
  return (session.round.startingPlayer + session.phase.offset) % count;
}

/** Deals a round from the current settings. Rebuilds the pool if packs changed. */
function beginRound(session: Session): Session {
  const playerCount = session.players.length;
  if (!canStart(playerCount, session.impostorCount)) return session;

  const packsChanged =
    session.poolPackIds.length !== session.selectedPackIds.length ||
    session.poolPackIds.some((id) => !session.selectedPackIds.includes(id));

  const pool = packsChanged ? poolFor(session.selectedPackIds) : session.pool;
  const rng = createRng(session.nextSeed);
  const variant = resolveVariant(session.variantSetting, rng);

  const result = createRound(
    { playerCount, impostorCount: session.impostorCount, variant },
    pool,
    rng,
  );

  if (result.kind === "exhausted") {
    return { ...session, pool, poolPackIds: [...session.selectedPackIds], exhausted: true };
  }

  return {
    ...session,
    pool: result.pool,
    poolPackIds: [...session.selectedPackIds],
    round: result.round,
    nextSeed: session.nextSeed + 1,
    exhausted: false,
    phase: { name: "handoff", index: 0 },
  };
}

function isSetupPhase(phase: Phase): boolean {
  return SETUP_PHASES.includes(phase.name);
}

export function reducer(session: Session, action: Action): Session {
  const { phase } = session;

  switch (action.type) {
    case "navigate":
      if (!isSetupPhase(phase)) return session;
      return { ...session, phase: { name: action.to } };

    case "addPlayer": {
      if (session.players.length >= MAX_PLAYERS) return session;
      const name = action.name.trim();
      if (!name) return session;
      const nextId = session.players.reduce((max, p) => Math.max(max, p.id), -1) + 1;
      const players: Player[] = [...session.players, { id: nextId, name }];
      return { ...session, players };
    }

    case "renamePlayer": {
      const name = action.name.trim();
      if (!name) return session;
      return {
        ...session,
        players: session.players.map((p) => (p.id === action.id ? { ...p, name } : p)),
      };
    }

    case "removePlayer":
      return { ...session, players: session.players.filter((p) => p.id !== action.id) };

    case "togglePack": {
      const pack = packById(action.id);
      if (!pack) return session;
      if (pack.tier === "friends" && !session.friendsUnlocked) return session;

      const selected = session.selectedPackIds.includes(action.id)
        ? session.selectedPackIds.filter((id) => id !== action.id)
        : [...session.selectedPackIds, action.id];
      return { ...session, selectedPackIds: selected };
    }

    case "unlockFriends":
      return { ...session, friendsUnlocked: true };

    case "setVariant":
      return { ...session, variantSetting: action.setting };

    case "setImpostorCount": {
      const cap = maxImpostorCount(Math.max(session.players.length, MIN_PLAYERS));
      const count = Math.min(Math.max(1, action.count), cap);
      return { ...session, impostorCount: count };
    }

    case "setTimer":
      return { ...session, timerSeconds: action.seconds };

    case "startRound":
    case "nextRound":
      return beginRound(session);

    case "recyclePool":
      return beginRound({ ...session, pool: recyclePool(session.pool), exhausted: false });

    case "revealCard":
      if (phase.name !== "handoff") return session;
      return { ...session, phase: { name: "reveal", index: phase.index } };

    case "nextPlayer": {
      if (phase.name !== "reveal") return session;
      const next = phase.index + 1;
      if (next < session.players.length) {
        return { ...session, phase: { name: "handoff", index: next } };
      }
      return { ...session, phase: { name: "hints", pass: 1, offset: 0 } };
    }

    case "nextHint": {
      if (phase.name !== "hints") return session;
      const next = phase.offset + 1;
      if (next < session.players.length) {
        return { ...session, phase: { ...phase, offset: next } };
      }
      if (phase.pass === 1) {
        return { ...session, phase: { name: "hints", pass: 2, offset: 0 } };
      }
      return { ...session, phase: { name: "discussion" } };
    }

    case "endDiscussion":
      if (phase.name !== "discussion") return session;
      return { ...session, phase: { name: "vote" } };

    case "castVote": {
      if (phase.name !== "vote" || !session.round) return session;
      const accusedWasImpostor = session.round.assignments.some(
        (a) => a.playerId === action.accused && a.isImpostor,
      );
      return {
        ...session,
        phase: {
          name: "resolution",
          accused: action.accused,
          accusedWasImpostor,
          stealBackPending: accusedWasImpostor,
          stealBackCorrect: false,
        },
      };
    }

    case "resolveStealBack":
      if (phase.name !== "resolution" || !phase.stealBackPending) return session;
      return {
        ...session,
        phase: { ...phase, stealBackPending: false, stealBackCorrect: action.correct },
      };

    case "finishRound": {
      if (phase.name !== "resolution" || phase.stealBackPending || !session.round) return session;
      const delta = scoreRound(session.round, {
        accused: phase.accused,
        accusedWasImpostor: phase.accusedWasImpostor,
        stealBackCorrect: phase.stealBackCorrect,
      });
      return {
        ...session,
        scores: applyDelta(session.scores, delta),
        phase: { name: "scoreboard" },
      };
    }

    case "endGame":
      return { ...session, round: null, scores: {}, exhausted: false, phase: { name: "home" } };
  }
}
