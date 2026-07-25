import type { Pack } from "./types";
import { makla } from "./packs/makla";

export const allPacks: readonly Pack[] = [makla];

export * from "./types";
export { pairKey, validateAllPacks } from "./schema";
