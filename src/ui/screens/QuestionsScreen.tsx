import { currentAsker, currentTarget } from "../../state/reducer";
import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";

export function QuestionsScreen() {
  const session = useSession();
  const dispatch = useDispatch();

  const askerId = currentAsker(session);
  const targetId = currentTarget(session);
  const asker = session.players.find((player) => player.id === askerId);
  const target = session.players.find((player) => player.id === targetId);

  return (
    <section className="screen screen--questions">
      <p className="dim">{strings.turnOf}</p>

      <div className="ask">
        <h2 className="ask__name">{asker?.name}</h2>
        <p className="ask__verb">{strings.asks}</p>
        <h2 className="ask__name ask__name--target">{target?.name}</h2>
      </div>

      <p className="dim">{strings.questionHint}</p>

      <Button onClick={() => dispatch({ type: "nextQuestion" })}>{strings.asked}</Button>
    </section>
  );
}
