import { useCallback } from "react";
import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";
import { Timer } from "../components/Timer";

export function DiscussionScreen() {
  const session = useSession();
  const dispatch = useDispatch();
  const toVote = useCallback(() => dispatch({ type: "endDiscussion" }), [dispatch]);

  return (
    <section className="screen screen--discussion">
      <h2>{strings.discussionTitle}</h2>
      {session.timerSeconds !== null && (
        <Timer seconds={session.timerSeconds} onComplete={toVote} />
      )}
      <Button onClick={toVote}>{strings.startVote}</Button>
    </section>
  );
}
