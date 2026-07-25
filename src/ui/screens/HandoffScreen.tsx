import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";

export function HandoffScreen({ index }: { index: number }) {
  const session = useSession();
  const dispatch = useDispatch();
  const player = session.players[index];
  if (!player) return null;

  return (
    <section className="screen screen--handoff">
      <p className="dim">{strings.handoffTo}</p>
      <h2>{player.name}</h2>
      <Button onClick={() => dispatch({ type: "revealCard" })}>
        {strings.iAm} {player.name}
      </Button>
    </section>
  );
}
