import { useEffect, useRef, useState } from "react";
import { setKeepAwake } from "../../platform/keepAwake";

function format(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function Timer({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const fired = useRef(false);

  // The phone must not sleep during a three-minute discussion.
  useEffect(() => {
    void setKeepAwake(true);
    return () => void setKeepAwake(false);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !fired.current) {
      fired.current = true;
      onComplete();
    }
  }, [remaining, onComplete]);

  return (
    <output role="timer" className="timer" dir="ltr">
      {format(remaining)}
    </output>
  );
}
