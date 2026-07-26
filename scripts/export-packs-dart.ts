/**
 * Regenerates the Flutter content packs from the TypeScript ones, so the two
 * apps can never drift. The TS packs stay the single source of truth.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { allPacks } from "../src/content/index";
import { validateAllPacks } from "../src/content/schema";

const errors = validateAllPacks(allPacks);
if (errors.length > 0) {
  console.error("Refusing to export invalid content:");
  for (const error of errors) console.error(`  • ${error}`);
  process.exit(1);
}

const outDir = "flutter_app/lib/content";
mkdirSync(outDir, { recursive: true });

const q = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

const body = allPacks
  .map((pack) => {
    const pairs = pack.pairs
      .map((p) => `    WordPair(${q(p.a)}, ${q(p.b)}),`)
      .join("\n");
    return `  Pack(
    id: ${q(pack.id)},
    name: ${q(pack.name)},
    tier: Tier.${pack.tier},
    emoji: ${q(pack.emoji)},
    pairs: [
${pairs}
    ],
  ),`;
  })
  .join("\n");

const file = `// GENERATED FILE — do not edit by hand.
// Regenerate with: npm run export:dart
// Source of truth: src/content/packs/*.ts

import 'types.dart';

const List<Pack> allPacks = [
${body}
];
`;

writeFileSync(`${outDir}/packs.dart`, file);

const pairCount = allPacks.reduce((sum, p) => sum + p.pairs.length, 0);
console.log(`✅ exported ${allPacks.length} packs, ${pairCount} pairs → ${outDir}/packs.dart`);
