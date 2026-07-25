import { defaultSettings, PERSIST_KEY, type PersistedSettings } from "./schema";
import { loadSettings, saveSettings, type SettingsStore } from "./storage";

function memoryStore(initial: Record<string, string> = {}): SettingsStore {
  const data = { ...initial };
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

test("returns defaults when nothing is stored", () => {
  expect(loadSettings(memoryStore())).toEqual(defaultSettings);
});

test("round-trips saved settings", () => {
  const store = memoryStore();
  const settings: PersistedSettings = {
    ...defaultSettings,
    playerNames: ["سامي", "أمين"],
    variantSetting: "chbih",
    timerSeconds: 120,
  };
  saveSettings(settings, store);
  expect(loadSettings(store)).toEqual(settings);
});

test("falls back to defaults on unparseable JSON", () => {
  expect(loadSettings(memoryStore({ [PERSIST_KEY]: "{{{not json" }))).toEqual(defaultSettings);
});

test("falls back to defaults on a stale version", () => {
  const stale = JSON.stringify({ ...defaultSettings, version: 0 });
  expect(loadSettings(memoryStore({ [PERSIST_KEY]: stale }))).toEqual(defaultSettings);
});

test("falls back to defaults on a schema violation", () => {
  const bad = JSON.stringify({ ...defaultSettings, impostorCount: "برشة" });
  expect(loadSettings(memoryStore({ [PERSIST_KEY]: bad }))).toEqual(defaultSettings);
});

test("drops pack ids that no longer exist", () => {
  const stored = JSON.stringify({
    ...defaultSettings,
    selectedPackIds: ["makla", "deleted-pack"],
  });
  expect(loadSettings(memoryStore({ [PERSIST_KEY]: stored })).selectedPackIds).toEqual(["makla"]);
});

test("restores the family default when every stored pack is gone", () => {
  const stored = JSON.stringify({
    ...defaultSettings,
    selectedPackIds: ["gone", "also-gone"],
  });
  const loaded = loadSettings(memoryStore({ [PERSIST_KEY]: stored }));
  expect(loaded.selectedPackIds).toEqual(defaultSettings.selectedPackIds);
});

test("a throwing store does not crash loading", () => {
  const hostile: SettingsStore = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {},
  };
  expect(loadSettings(hostile)).toEqual(defaultSettings);
});

test("a throwing store does not crash saving", () => {
  const hostile: SettingsStore = {
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceeded");
    },
  };
  expect(() => saveSettings(defaultSettings, hostile)).not.toThrow();
});
