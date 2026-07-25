import { KeepAwake } from "@capacitor-community/keep-awake";

export async function setKeepAwake(on: boolean): Promise<void> {
  try {
    if (on) await KeepAwake.keepAwake();
    else await KeepAwake.allowSleep();
  } catch {
    // Unsupported off-device. The timer still runs; the screen may just dim.
  }
}
