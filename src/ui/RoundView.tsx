import { useSession } from "../state/SessionContext";
import { DiscussionScreen } from "./screens/DiscussionScreen";
import { HandoffScreen } from "./screens/HandoffScreen";
import { QuestionsScreen } from "./screens/QuestionsScreen";
import { ResolutionScreen } from "./screens/ResolutionScreen";
import { RevealScreen } from "./screens/RevealScreen";
import { ScoreboardScreen } from "./screens/ScoreboardScreen";
import { VoteScreen } from "./screens/VoteScreen";

/** Renders the screen for any in-round phase; null for setup phases. */
export function RoundView() {
  const { phase } = useSession();

  switch (phase.name) {
    case "handoff":
      return <HandoffScreen index={phase.index} />;
    case "reveal":
      return <RevealScreen index={phase.index} />;
    case "questions":
      return <QuestionsScreen />;
    case "discussion":
      return <DiscussionScreen />;
    case "vote":
      return <VoteScreen />;
    case "resolution":
      return (
        <ResolutionScreen
          accused={phase.accused}
          accusedWasImpostor={phase.accusedWasImpostor}
          stealBackPending={phase.stealBackPending}
        />
      );
    case "scoreboard":
      return <ScoreboardScreen />;
    default:
      return null;
  }
}
