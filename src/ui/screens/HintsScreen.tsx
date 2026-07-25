import { currentHintPlayer } from "../../state/reducer";
import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";
import { toArabicDigits } from "../components/Timer";

export function HintsScreen({ pass }: { pass: 1 | 2 }) {
  const session = useSession();
  const dispatch = useDispatch();
  const playerId = currentHintPlayer(session);
  const player = session.players.find((candidate) => candidate.id === playerId);

  return (
    <section className="screen screen--hints">
      <p className="dim">
        {strings.passLabel} {toArabicDigits(pass)}
      </p>
      <h2>{strings.hintsTitle}</h2>
      <p className="dim">{strings.turnOf}</p>
      <h3>{player?.name}</h3>
      <Button onClick={() => dispatch({ type: "nextHint" })}>{strings.saidIt}</Button>
    </section>
  );
}
