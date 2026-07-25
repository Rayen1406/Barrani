import { useDispatch } from "../../state/SessionContext";
import { strings } from "../../strings";
import { APP_VERSION } from "../../version";
import { Button } from "../components/Button";
import { toArabicDigits } from "../components/Timer";

export function RulesScreen() {
  const dispatch = useDispatch();

  return (
    <section className="screen">
      <h2>{strings.rules}</h2>

      <ol className="stack rules">
        {strings.rulesBody.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>

      <p className="dim">
        {strings.version} {toArabicDigits(APP_VERSION)}
      </p>

      <Button variant="ghost" onClick={() => dispatch({ type: "navigate", to: "home" })}>
        {strings.back}
      </Button>
    </section>
  );
}
