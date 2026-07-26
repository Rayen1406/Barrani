import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";

type Props = {
  accused: number;
  accusedWasImpostor: boolean;
  stealBackPending: boolean;
};

export function ResolutionScreen({ accused, accusedWasImpostor, stealBackPending }: Props) {
  const session = useSession();
  const dispatch = useDispatch();
  const round = session.round;
  if (!round) return null;

  const accusedPlayer = session.players.find((player) => player.id === accused);
  const impostorNames = session.players
    .filter((player) => round.assignments.some((a) => a.playerId === player.id && a.isImpostor))
    .map((player) => player.name)
    .join(" و ");

  if (stealBackPending) {
    return (
      <section className="screen screen--resolution">
        <h2 className="verdict verdict--caught">{strings.caught}</h2>
        <p>{accusedPlayer?.name}</p>
        <p className="dim">{strings.stealBackPrompt}</p>
        <div className="stack">
          <Button onClick={() => dispatch({ type: "resolveStealBack", correct: true })}>
            {strings.guessedRight}
          </Button>
          <Button
            variant="ghost"
            onClick={() => dispatch({ type: "resolveStealBack", correct: false })}
          >
            {strings.guessedWrong}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="screen screen--resolution">
      <h2 className={accusedWasImpostor ? "verdict verdict--caught" : "verdict verdict--missed"}>
        {accusedWasImpostor ? strings.caught : strings.missed}
      </h2>
      <p className="dim">{strings.barraniWas}</p>
      <h3>{impostorNames}</h3>
      <p className="dim">
        {round.variant === "chbih" ? strings.groupWordWas : strings.secretWordWas}
      </p>
      <h3 className="word">{round.pair.a}</h3>
      <Button onClick={() => dispatch({ type: "finishRound" })}>{strings.scores}</Button>
    </section>
  );
}
