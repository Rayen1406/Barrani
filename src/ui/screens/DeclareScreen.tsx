import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";

export function DeclareScreen() {
  const session = useSession();
  const dispatch = useDispatch();

  return (
    <section className="screen screen--declare">
      <h2>{strings.declareTitle}</h2>
      <p className="notice">{strings.declareWarning}</p>

      <div className="stack">
        {session.players.map((player) => (
          <Button
            key={player.id}
            variant="ghost"
            onClick={() => dispatch({ type: "declareGuess", declarer: player.id })}
          >
            {player.name}
          </Button>
        ))}
      </div>

      <Button variant="ghost" onClick={() => dispatch({ type: "cancelDeclare" })}>
        {strings.backToDiscussion}
      </Button>
    </section>
  );
}
