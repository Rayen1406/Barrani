import type { RoundOutcome } from "../../engine/types";
import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";

type Props = {
  outcome: RoundOutcome;
  pending: boolean;
};

export function ResolutionScreen({ outcome, pending }: Props) {
  const session = useSession();
  const dispatch = useDispatch();
  const round = session.round;
  if (!round) return null;

  const nameOf = (id: number) => session.players.find((player) => player.id === id)?.name;

  const impostorNames = session.players
    .filter((player) => round.assignments.some((a) => a.playerId === player.id && a.isImpostor))
    .map((player) => player.name)
    .join(" و ");

  const groupWord = round.pair.a;
  const wordLabel = round.variant === "chbih" ? strings.groupWordWas : strings.secretWordWas;

  /** Someone still owes a spoken guess — the table adjudicates it. */
  if (pending) {
    const isDeclaration = outcome.kind === "declare";
    return (
      <section className="screen screen--resolution">
        <h2 className="verdict verdict--caught">
          {isDeclaration ? strings.wantsToGuess : strings.caught}
        </h2>
        <h3>{nameOf(isDeclaration ? outcome.declarer : outcome.accused)}</h3>
        {!isDeclaration && <p className="dim">{strings.stealBackPrompt}</p>}
        <p className="notice">{strings.sayTheWord}</p>
        <div className="stack">
          <Button onClick={() => dispatch({ type: "resolveGuess", correct: true })}>
            {strings.guessedRight}
          </Button>
          <Button variant="ghost" onClick={() => dispatch({ type: "resolveGuess", correct: false })}>
            {strings.guessedWrong}
          </Button>
        </div>
      </section>
    );
  }

  const barraniWon =
    outcome.kind === "vote"
      ? !outcome.accusedWasImpostor
      : !outcome.declarerWasImpostor || outcome.guessCorrect;

  let headline: string;
  if (outcome.kind === "vote") {
    headline = outcome.accusedWasImpostor ? strings.caught : strings.missed;
  } else if (!outcome.declarerWasImpostor) {
    headline = strings.notBarrani;
  } else {
    headline = outcome.guessCorrect ? strings.boldWin : strings.boldFail;
  }

  return (
    <section className="screen screen--resolution">
      <h2 className={barraniWon ? "verdict verdict--missed" : "verdict verdict--caught"}>
        {headline}
      </h2>

      {outcome.kind === "declare" && !outcome.declarerWasImpostor && (
        <p className="notice">{strings.tableBlundered}</p>
      )}

      <p className="dim">{strings.barraniWas}</p>
      <h3>{impostorNames}</h3>

      <p className="dim">{wordLabel}</p>
      <h3 className="word">{groupWord}</h3>

      <Button onClick={() => dispatch({ type: "finishRound" })}>{strings.scores}</Button>
    </section>
  );
}
