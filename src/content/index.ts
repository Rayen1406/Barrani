import type { Pack } from "./types";
import { makla } from "./packs/makla";
import { blayes } from "./packs/blayes";
import { telfza } from "./packs/telfza";
import { koratElQadam } from "./packs/korat-el-qadam";
import { mouzikaMzoued } from "./packs/mouzika-mzoued";
import { madrsa } from "./packs/madrsa";
import { ramdhan } from "./packs/ramdhan";
import { hayawanat } from "./packs/hayawanat";
import { hwayejEddar } from "./packs/hwayej-eddar";
import { slag } from "./packs/slag";
import { hayatElHouma } from "./packs/hayat-el-houma";

export const allPacks: readonly Pack[] = [
  makla,
  blayes,
  telfza,
  koratElQadam,
  mouzikaMzoued,
  madrsa,
  ramdhan,
  hayawanat,
  hwayejEddar,
  slag,
  hayatElHouma,
];

export * from "./types";
export { pairKey, validateAllPacks } from "./schema";
