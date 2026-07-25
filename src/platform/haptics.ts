import { Haptics, ImpactStyle } from "@capacitor/haptics";

/** Silent feedback. Never throws — off-device this is simply nothing. */
export async function tap(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // No haptics engine (browser, emulator). Not an error.
  }
}
