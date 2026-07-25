import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { PERSIST_VERSION, type PersistedSettings } from "../persist/schema";
import { loadSettings, saveSettings } from "../persist/storage";
import { createSession, reducer } from "./reducer";
import type { Action, Session } from "./types";

const SessionCtx = createContext<Session | null>(null);
const DispatchCtx = createContext<Dispatch<Action> | null>(null);

/** Only settings persist. In-round state never touches disk — that would leak roles. */
function toSettings(session: Session): PersistedSettings {
  return {
    version: PERSIST_VERSION,
    playerNames: session.players.map((player) => player.name),
    selectedPackIds: session.selectedPackIds,
    friendsUnlocked: session.friendsUnlocked,
    variantSetting: session.variantSetting,
    impostorCount: session.impostorCount,
    timerSeconds: session.timerSeconds as PersistedSettings["timerSeconds"],
  };
}

export function SessionProvider({ seed, children }: { seed?: number; children: ReactNode }) {
  const [session, dispatch] = useReducer(reducer, undefined, () =>
    createSession(loadSettings(), seed ?? Date.now()),
  );

  useEffect(() => {
    saveSettings(toSettings(session));
  }, [
    session.players,
    session.selectedPackIds,
    session.friendsUnlocked,
    session.variantSetting,
    session.impostorCount,
    session.timerSeconds,
  ]);

  return (
    <SessionCtx.Provider value={session}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </SessionCtx.Provider>
  );
}

export function useSession(): Session {
  const session = useContext(SessionCtx);
  if (!session) throw new Error("useSession must be used inside a SessionProvider");
  return session;
}

export function useDispatch(): Dispatch<Action> {
  const dispatch = useContext(DispatchCtx);
  if (!dispatch) throw new Error("useDispatch must be used inside a SessionProvider");
  return dispatch;
}
