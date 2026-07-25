import { useCallback, useRef, useState, type ReactNode } from "react";
import { tap } from "../../platform/haptics";
import { useHiddenReset } from "../../platform/useHiddenReset";
import { strings } from "../../strings";

type Props = {
  label: string;
  holdMs?: number;
  onRevealed?: () => void;
  children: ReactNode;
};

/**
 * Children are mounted ONLY while revealed. Never render the secret and hide it
 * with CSS — an unrendered word cannot be screenshotted or flashed mid-render.
 */
export function HoldToReveal({ label, holdMs = 600, onRevealed, children }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);

  const start = useCallback(() => {
    if (revealed || timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      setRevealed(true);
      void tap();
      onRevealed?.();
    }, holdMs);
  }, [holdMs, onRevealed, revealed]);

  useHiddenReset(
    useCallback(() => {
      cancel();
      setRevealed(false);
    }, [cancel]),
  );

  if (revealed) return <>{children}</>;

  return (
    <button
      type="button"
      className="hold"
      onTouchStart={start}
      onTouchEnd={cancel}
      onTouchCancel={cancel}
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onContextMenu={(event) => event.preventDefault()}
    >
      {holding ? strings.holdingHint : label}
    </button>
  );
}
