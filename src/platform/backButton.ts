import { App } from "@capacitor/app";

/** Return true to swallow the gesture, false to let the app close. */
export type BackHandler = () => boolean;

/**
 * The Android back gesture is a real leak vector — it must never walk backwards
 * into a screen that was showing a secret word.
 */
export async function registerBackHandler(handle: BackHandler): Promise<() => void> {
  try {
    const listener = await App.addListener("backButton", () => {
      if (handle()) return;
      void App.exitApp();
    });
    return () => void listener.remove();
  } catch {
    // Not running under Capacitor — nothing to unsubscribe.
    return () => {};
  }
}
