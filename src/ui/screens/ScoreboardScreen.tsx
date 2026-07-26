import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";

export function ScoreboardScreen() {
  const session = useSession();
  const dispatch = useDispatch();

  const ranked = [...session.players].sort(
    (a, b) => (session.scores[b.id] ?? 0) - (session.scores[a.id] ?? 0),
  );

  return (
    <section className="screen screen--scoreboard">
      <h2>{strings.scores}</h2>

      {session.exhausted && (
        <div className="stack">
          <p className="notice">{strings.exhausted}</p>
          <Button onClick={() => dispatch({ type: "recyclePool" })}>{strings.recycle}</Button>
        </div>
      )}

      <ul className="stack">
        {ranked.map((player) => (
          <li key={player.id} className="row">
            <span>{player.name}</span>
            <strong>{session.scores[player.id] ?? 0}</strong>
          </li>
        ))}
      </ul>

      <Button onClick={() => dispatch({ type: "nextRound" })}>{strings.nextRound}</Button>
      <Button variant="ghost" onClick={() => dispatch({ type: "endGame" })}>
        {strings.endGame}
      </Button>
    </section>
  );
}
