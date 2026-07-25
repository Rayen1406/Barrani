import { z } from "zod";
import { allPacks } from "../content";
import { MAX_PLAYERS } from "../engine/roles";

export const PERSIST_KEY = "barrani:settings";
export const PERSIST_VERSION = 1;

export const TIMER_CHOICES = [60, 120, 180, 300, null] as const;

export const settingsSchema = z.object({
  version: z.literal(PERSIST_VERSION),
  playerNames: z.array(z.string().min(1).max(16)).max(MAX_PLAYERS),
  selectedPackIds: z.array(z.string()),
  friendsUnlocked: z.boolean(),
  variantSetting: z.enum(["barrani", "chbih", "random"]),
  impostorCount: z.number().int().min(1).max(MAX_PLAYERS),
  timerSeconds: z.union([
    z.literal(60),
    z.literal(120),
    z.literal(180),
    z.literal(300),
    z.null(),
  ]),
});

export type PersistedSettings = z.infer<typeof settingsSchema>;

export const familyPackIds = allPacks.filter((pack) => pack.tier === "family").map((p) => p.id);

export const defaultSettings: PersistedSettings = {
  version: PERSIST_VERSION,
  playerNames: [],
  selectedPackIds: familyPackIds,
  friendsUnlocked: false,
  variantSetting: "random",
  impostorCount: 1,
  timerSeconds: 180,
};
