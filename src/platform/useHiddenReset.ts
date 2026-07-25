import { useEffect, useRef } from "react";

/**
 * Runs onHidden whenever the app leaves the foreground.
 * This is the leak guard: a revealed card must not survive the phone being
 * locked, backgrounded, or handed over mid-animation.
 */
export function useHiddenReset(onHidden: () => void): void {
  const latest = useRef(onHidden);
  latest.current = onHidden;

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") latest.current();
    };
    const onPageHide = () => latest.current();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);
}
