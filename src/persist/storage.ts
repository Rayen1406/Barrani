import { allPacks } from "../content";
import { defaultSettings, PERSIST_KEY, settingsSchema, type PersistedSettings } from "./schema";

export type SettingsStore = Pick<Storage, "getItem" | "setItem">;

function defaultStore(): SettingsStore | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Drops pack ids that no longer ship, and friends packs while the tier is locked. */
function sanitizePackIds(ids: readonly string[], friendsUnlocked: boolean): string[] {
  const allowed = new Set(
    allPacks.filter((pack) => friendsUnlocked || pack.tier === "family").map((pack) => pack.id),
  );
  const kept = ids.filter((id) => allowed.has(id));
  return kept.length > 0 ? kept : [...defaultSettings.selectedPackIds];
}

export function loadSettings(store: SettingsStore | null = defaultStore()): PersistedSettings {
  if (!store) return defaultSettings;

  let raw: string | null;
  try {
    raw = store.getItem(PERSIST_KEY);
  } catch {
    return defaultSettings;
  }
  if (!raw) return defaultSettings;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaultSettings;
  }

  const result = settingsSchema.safeParse(parsed);
  if (!result.success) return defaultSettings;

  return {
    ...result.data,
    selectedPackIds: sanitizePackIds(result.data.selectedPackIds, result.data.friendsUnlocked),
  };
}

export function saveSettings(
  settings: PersistedSettings,
  store: SettingsStore | null = defaultStore(),
): void {
  if (!store) return;
  try {
    store.setItem(PERSIST_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or blocked — settings are a convenience, never a requirement.
  }
}
