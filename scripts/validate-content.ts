import { allPacks } from "../src/content/index";
import { validateAllPacks } from "../src/content/schema";

const errors = validateAllPacks(allPacks);

if (errors.length > 0) {
  console.error(`\n❌ ${errors.length} مشكلة في المحتوى:\n`);
  for (const error of errors) console.error(`  • ${error}`);
  process.exit(1);
}

const pairCount = allPacks.reduce((sum, pack) => sum + pack.pairs.length, 0);
console.log(`✅ ${allPacks.length} حزمة، ${pairCount} زوج — الكل صحيح`);
