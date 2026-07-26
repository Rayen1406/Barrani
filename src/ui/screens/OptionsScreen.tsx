import { MIN_PLAYERS } from "../../engine/roles";
import { maxImpostorCount } from "../../engine/round";
import type { VariantSetting } from "../../engine/types";
import { TIMER_CHOICES } from "../../persist/schema";
import { useDispatch, useSession } from "../../state/SessionContext";
import { strings } from "../../strings";
import { Button } from "../components/Button";

const VARIANTS: { value: VariantSetting; label: string; hint?: string }[] = [
  { value: "random", label: strings.variantRandom },
  { value: "barrani", label: strings.variantBarrani, hint: strings.variantBarraniHint },
  { value: "chbih", label: strings.variantChbih, hint: strings.variantChbihHint },
];

export function OptionsScreen() {
  const session = useSession();
  const dispatch = useDispatch();
  const cap = maxImpostorCount(Math.max(session.players.length, MIN_PLAYERS));

  return (
    <section className="screen">
      <h2>{strings.options}</h2>

      <fieldset>
        <legend>{strings.variant}</legend>
        {VARIANTS.map((option) => (
          <label key={option.value} className="row">
            <input
              type="radio"
              name="variant"
              checked={session.variantSetting === option.value}
              onChange={() => dispatch({ type: "setVariant", setting: option.value })}
            />
            <span>{option.label}</span>
            {option.hint && <small className="dim">{option.hint}</small>}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>{strings.impostorCount}</legend>
        {Array.from({ length: cap }, (_, i) => i + 1).map((count) => (
          <label key={count} className="row">
            <input
              type="radio"
              name="impostors"
              checked={session.impostorCount === count}
              onChange={() => dispatch({ type: "setImpostorCount", count })}
            />
            <span>{count}</span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>{strings.discussionTime}</legend>
        {TIMER_CHOICES.map((seconds) => (
          <label key={String(seconds)} className="row">
            <input
              type="radio"
              name="timer"
              checked={session.timerSeconds === seconds}
              onChange={() => dispatch({ type: "setTimer", seconds })}
            />
            <span>
              {seconds === null ? strings.noTimer : `${seconds / 60} ${strings.minutes}`}
            </span>
          </label>
        ))}
      </fieldset>

      <Button variant="ghost" onClick={() => dispatch({ type: "navigate", to: "home" })}>
        {strings.back}
      </Button>
    </section>
  );
}
