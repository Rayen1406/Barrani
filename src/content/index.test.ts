import { allPacks } from "./index";
import { validateAllPacks } from "./schema";
import { MIN_PAIRS_PER_PACK } from "./types";

test("every shipped pack is valid", () => {
  expect(validateAllPacks(allPacks)).toEqual([]);
});

test("every pack meets the pair floor", () => {
  for (const pack of allPacks) {
    expect(pack.pairs.length).toBeGreaterThanOrEqual(MIN_PAIRS_PER_PACK);
  }
});

test("pack ids are unique", () => {
  const ids = allPacks.map((pack) => pack.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("ships nine family packs and two friends packs", () => {
  expect(allPacks.filter((pack) => pack.tier === "family")).toHaveLength(9);
  expect(allPacks.filter((pack) => pack.tier === "friends")).toHaveLength(2);
});

test("the friends packs are the two expected ones", () => {
  const friendsIds = allPacks
    .filter((pack) => pack.tier === "friends")
    .map((pack) => pack.id)
    .sort();
  expect(friendsIds).toEqual(["hayat-el-houma", "slag"]);
});
