import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { HoldToReveal } from "../components/HoldToReveal";

export function RevealScreen({ index }: { index: number }) {
  const session = useSession();
  const dispatch = useDispatch();
  const player = session.players[index];
  const assignment = session.round?.assignments[index];
  if (!player || !assignment) return null;

  return (
    <section className="screen screen--reveal">
      <HoldToReveal label={strings.holdToReveal} holdMs={600}>
        {assignment.word === null ? (
          <Card tone="impostor">
            <h2>{strings.youAreBarrani}</h2>
            <p className="dim">{strings.barraniHint}</p>
          </Card>
        ) : (
          <Card>
            <p className="dim">{strings.yourWord}</p>
            <h2 className="word">{assignment.word}</h2>
          </Card>
        )}
        <Button onClick={() => dispatch({ type: "nextPlayer" })}>{strings.next}</Button>
      </HoldToReveal>
    </section>
  );
}
