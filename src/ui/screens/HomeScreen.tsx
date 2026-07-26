import { canStart } from "../../engine/round";
import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";
import logo from "../../assets/logo.webp";

export function HomeScreen() {
  const session = useSession();
  const dispatch = useDispatch();
  const ready = canStart(session.players.length, session.impostorCount);
  const hasPacks = session.selectedPackIds.length > 0;

  return (
    <section className="screen screen--home">
      <h1>
        <img className="logo" src={logo} alt={strings.appName} />
      </h1>
      <p className="dim">{strings.tagline}</p>

      <Button disabled={!ready || !hasPacks} onClick={() => dispatch({ type: "startRound" })}>
        {strings.start}
      </Button>
      {!ready && <p className="notice">{strings.needMorePlayers}</p>}
      {!hasPacks && <p className="notice">{strings.needOnePack}</p>}

      <nav className="stack">
        <Button variant="ghost" onClick={() => dispatch({ type: "navigate", to: "players" })}>
          {strings.players}
        </Button>
        <Button variant="ghost" onClick={() => dispatch({ type: "navigate", to: "packs" })}>
          {strings.packs}
        </Button>
        <Button variant="ghost" onClick={() => dispatch({ type: "navigate", to: "options" })}>
          {strings.options}
        </Button>
        <Button variant="ghost" onClick={() => dispatch({ type: "navigate", to: "rules" })}>
          {strings.rules}
        </Button>
      </nav>
    </section>
  );
}
