import { validateAllPacks } from "./schema";
import type { Pack, WordPair } from "./types";

const pair = (a: string, b: string): WordPair => ({ a, b });

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}

function packOf(id: string, pairs: WordPair[]): Pack {
  return { id, name: "تجربة", tier: "family", emoji: "🍽️", pairs };
}

function fillTo25(extra: WordPair[] = []): WordPair[] {
  const base = Array.from({ length: 25 - extra.length }, (_, i) =>
    pair(`كلمة${toArabicDigits(i)}`, `حاجة${toArabicDigits(i)}`),
  );
  return [...extra, ...base];
}

test("a well-formed pack produces no errors", () => {
  expect(validateAllPacks([packOf("makla", fillTo25())])).toEqual([]);
});

test("rejects a pack with fewer than 25 pairs", () => {
  const errors = validateAllPacks([packOf("makla", [pair("كسكسي", "مقرونة")])]);
  expect(errors.join(" ")).toMatch(/makla.*25/);
});

test("rejects an empty word", () => {
  const errors = validateAllPacks([packOf("makla", fillTo25([pair("كسكسي", "")]))]);
  expect(errors.join(" ")).toMatch(/makla/);
});

test("rejects Latin script", () => {
  const errors = validateAllPacks([packOf("makla", fillTo25([pair("kousksi", "مقرونة")]))]);
  expect(errors.join(" ")).toMatch(/حروف عربية/);
});

test("rejects a word longer than the card allows", () => {
  const long = "ك".repeat(23);
  const errors = validateAllPacks([packOf("makla", fillTo25([pair(long, "مقرونة")]))]);
  expect(errors.join(" ")).toMatch(/طويلة/);
});

test("accepts ڨ and the shadda, which Derja needs", () => {
  const errors = validateAllPacks([packOf("makla", fillTo25([pair("مرڨاز", "برّاني")]))]);
  expect(errors).toEqual([]);
});

test("rejects a duplicate word inside one pack", () => {
  const errors = validateAllPacks([
    packOf("makla", fillTo25([pair("كسكسي", "مقرونة"), pair("كسكسي", "بريك")])),
  ]);
  expect(errors.join(" ")).toMatch(/كسكسي/);
});

test("rejects the same pair appearing in two packs", () => {
  const dup = pair("كسكسي", "مقرونة");
  const errors = validateAllPacks([
    packOf("makla", fillTo25([dup])),
    packOf("blayes", fillTo25([dup])),
  ]);
  expect(errors.join(" ")).toMatch(/blayes/);
});

test("treats a reversed pair as the same pair across packs", () => {
  const errors = validateAllPacks([
    packOf("makla", fillTo25([pair("كسكسي", "مقرونة")])),
    packOf("blayes", fillTo25([pair("مقرونة", "كسكسي")])),
  ]);
  expect(errors.join(" ")).toMatch(/blayes/);
});

test("rejects duplicate pack ids", () => {
  const errors = validateAllPacks([packOf("makla", fillTo25()), packOf("makla", fillTo25())]);
  expect(errors.join(" ")).toMatch(/makla/);
});

test("rejects a pair whose two words are identical", () => {
  const errors = validateAllPacks([packOf("makla", fillTo25([pair("كسكسي", "كسكسي")]))]);
  expect(errors.length).toBeGreaterThan(0);
});
