import { z } from "zod";
import { MAX_WORD_LENGTH, MIN_PAIRS_PER_PACK, type Pack, type WordPair } from "./types";

/**
 * The Arabic block plus a space and the apostrophes Derja borrows.
 * Deliberately broad enough for ڨ (مرڨاز) and the shadda (برّاني),
 * and narrow enough to reject Latin script outright.
 */
const ARABIC_ONLY = /^[؀-ۿݐ-ݿ\s'’-]+$/u;

const wordSchema = z
  .string()
  .min(1, "الكلمة فارغة")
  .max(MAX_WORD_LENGTH, `الكلمة طويلة برشة (أكثر من ${MAX_WORD_LENGTH} حرف)`)
  .refine((word) => word.trim() === word, "الكلمة فيها فراغ في البداية ولا في الآخر")
  .refine((word) => ARABIC_ONLY.test(word), "الكلمة لازمها تكون بحروف عربية فقط");

const pairSchema = z
  .object({ a: wordSchema, b: wordSchema })
  .refine((pair) => pair.a !== pair.b, "الزوج فيه نفس الكلمة مرّتين");

export const packSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "معرّف الحزمة لازمه حروف صغيرة و شرطات"),
  name: z.string().min(1),
  tier: z.enum(["family", "friends"]),
  emoji: z.string().min(1),
  pairs: z
    .array(pairSchema)
    .min(MIN_PAIRS_PER_PACK, `الحزمة تحتاج ${MIN_PAIRS_PER_PACK} زوج على الأقل`),
});

/** Order-independent identity for a pair, so a/b reversed counts as the same pair. */
export function pairKey(pair: WordPair): string {
  return [pair.a, pair.b].sort().join("|");
}

export function validateAllPacks(packs: readonly Pack[]): string[] {
  const errors: string[] = [];
  const seenPackIds = new Set<string>();
  const seenPairKeys = new Map<string, string>();

  for (const pack of packs) {
    const parsed = packSchema.safeParse(pack);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`[${pack.id}] ${issue.path.join(".")}: ${issue.message}`);
      }
    }

    if (seenPackIds.has(pack.id)) errors.push(`[${pack.id}] معرّف الحزمة متعاود`);
    seenPackIds.add(pack.id);

    const seenWords = new Set<string>();
    for (const pair of pack.pairs) {
      for (const word of [pair.a, pair.b]) {
        if (seenWords.has(word)) errors.push(`[${pack.id}] الكلمة متعاودة: ${word}`);
        seenWords.add(word);
      }

      const key = pairKey(pair);
      const owner = seenPairKeys.get(key);
      if (owner) {
        errors.push(`[${pack.id}] الزوج ${pair.a} / ${pair.b} موجود قبل في ${owner}`);
      } else {
        seenPairKeys.set(key, pack.id);
      }
    }
  }

  return errors;
}
