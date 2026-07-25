import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";

export function VoteScreen() {
  const session = useSession();
  const dispatch = useDispatch();

  return (
    <section className="screen screen--vote">
      <h2>{strings.voteTitle}</h2>
      <div className="stack">
        {session.players.map((player) => (
          <Button
            key={player.id}
            variant="ghost"
            onClick={() => dispatch({ type: "castVote", accused: player.id })}
          >
            {player.name}
          </Button>
        ))}
      </div>
    </section>
  );
}
