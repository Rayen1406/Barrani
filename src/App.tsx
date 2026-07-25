import { useEffect, useRef } from "react";
import { registerBackHandler } from "./platform/backButton";
import { SessionProvider, useDispatch, useSession } from "./state/SessionContext";
import type { Phase } from "./state/types";
import { RoundView } from "./ui/RoundView";
import { HomeScreen } from "./ui/screens/HomeScreen";
import { OptionsScreen } from "./ui/screens/OptionsScreen";
import { PacksScreen } from "./ui/screens/PacksScreen";
import { PlayersScreen } from "./ui/screens/PlayersScreen";
import { RulesScreen } from "./ui/screens/RulesScreen";

const SETUP_SUBSCREENS: Phase["name"][] = ["players", "packs", "options", "rules"];

/**
 * The Android back gesture must never walk backwards into a screen that was
 * showing a secret word, so it is swallowed outright during a round.
 */
function BackGuard() {
  const session = useSession();
  const dispatch = useDispatch();
  const phaseName = useRef(session.phase.name);
  phaseName.current = session.phase.name;
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useEffect(() => {
    let dispose = () => {};
    let cancelled = false;

    void registerBackHandler(() => {
      const name = phaseName.current;
      if (name === "home") return false; // let Android close the app
      if (SETUP_SUBSCREENS.includes(name)) {
        dispatchRef.current({ type: "navigate", to: "home" });
        return true;
      }
      return true; // mid-round: swallow it
    }).then((disposer) => {
      if (cancelled) disposer();
      else dispose = disposer;
    });

    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  return null;
}

function Screens() {
  const { phase } = useSession();

  switch (phase.name) {
    case "home":
      return <HomeScreen />;
    case "players":
      return <PlayersScreen />;
    case "packs":
      return <PacksScreen />;
    case "options":
      return <OptionsScreen />;
    case "rules":
      return <RulesScreen />;
    default:
      return <RoundView />;
  }
}

export function App({ seed }: { seed?: number } = {}) {
  return (
    <SessionProvider seed={seed}>
      <BackGuard />
      <main>
        <Screens />
      </main>
    </SessionProvider>
  );
}
