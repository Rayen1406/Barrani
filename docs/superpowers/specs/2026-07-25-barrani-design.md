# برّاني (Barrani) — Design

**Date:** 2026-07-25
**Status:** Approved design, pending implementation plan

## Summary

A Tunisian Derja party game for a single phone passed around a table. One player
is the odd one out — البراني — and the group has to find them by talking. Fully
offline, distributed as a sideloadable Android APK you can send over WhatsApp or
Bluetooth.

Inspired by the Arabic party app بكاسة / Bakasa, whose core mode is a
single-phone spy word game with category packs. Barrani takes that shape and
rebuilds the content layer around Tunisian food, places, football, TV and slang.

**The premise of the whole project:** the mechanics are not the moat. A spy word
game is a weekend's work and has been cloned a hundred times. What makes this
worth building is content that only lands in Tunisia. Design effort is therefore
weighted toward the content model and the "made for us" feel, and the engine is
kept deliberately boring.

## Decisions

| Question | Decision |
|---|---|
| Device model | Single phone, passed around. Fully offline. No server, no accounts. |
| Script | Arabic-script Derja, RTL. Not Arabizi. |
| Mode scope | One mode only, backed by deep content. |
| Round variants | Both البراني and الشبيه, fed by one pair-based content model. |
| Content tone | Two tiers: عايلي on by default, بين الأصحاب behind an explicit unlock. |
| Platform | Web app built with Vite + React + TypeScript. |
| Distribution | Android APK only, via Capacitor. No hosting, nothing on the internet. |

Rationale worth preserving:

- **Arabic script over Arabizi** because the game is literally passed hand to
  hand at a family gathering — parents and aunts have to be able to read it. It
  also makes the app feel like a real product rather than a meme.
- **One mode** because party games of this type sustain replay through content
  variety, not mode variety. Spyfall has one mode and people play it for years.
- **Pair-based content** because a pack of sibling pairs is a superset: it feeds
  الشبيه directly and feeds البراني by simply withholding the second word. No
  authoring work is wasted.
- **APK only** because APK-over-WhatsApp is already how software spreads in
  Tunisia, and it is the only way to hand someone the game with no internet at
  all. iPhones cannot be sideloaded; iOS is explicitly out of scope.

## The Game

### Setup — host holds the phone

1. **Players:** 3–12, editable nicknames, defaulting to لاعب ١، لاعب ٢… Names
   persist between sessions so a regular group is one tap away.
2. **Packs:** checkbox list. عايلي packs enabled by default. The بين الأصحاب
   tier requires an explicit unlock tap by the host.
3. **Variant:** البراني، الشبيه، or **عشوائي**. عشوائي is the default — not
   knowing which variant you are in is itself a layer of tension.
4. **Impostor count:** auto-suggested from player count (1 for 3–6, 2 for 7+),
   host may override.
5. **Discussion timer:** 1, 2, 3, or 5 minutes, or off. Default 3.

### Reveal — the phone goes around

A handoff screen reads *"الفون لـ سامي"*. That player taps their own name,
**presses and holds** to reveal their card, sees their word or the البراني
badge, taps عدّي, and the app returns immediately to a handoff screen for the
next player.

Press-and-hold rather than tap is deliberate: it makes an accidental reveal
while the phone is in motion nearly impossible. No back navigation exists during
this phase.

### Hints and discussion

The app picks a random starting player and displays turn order. Each player says
**one word** out loud about their secret word. Two passes of hints, then open
discussion.

**Hint passes are untimed** — the app only shows whose turn it is and advances
on a tap. Rushing someone into a bad hint is not fun.

**The discussion phase is timed.** Default 3 minutes, host-adjustable at setup
to 1, 2, 3, or 5 minutes, or off entirely. This is the timer that requires
`keep-awake`.

**The app deliberately does not capture what anyone says.** The talking,
accusing and laughing stays entirely off-app. The app is a dealer and a referee,
nothing more.

### Vote and resolution

**One vote per round, regardless of impostor count.** The host taps whoever the
table voted out; the app reveals whether that player was an impostor. Two
impostors makes the round genuinely harder for the innocents, which is the
correct difficulty curve for a 7+ player table, and it keeps rounds short.

If an impostor was caught, that player gets one attempt to steal the round back:

- In **البراني**, they hold no word, so they attempt to name the group's secret
  word.
- In **الشبيه**, they already hold a word, so they attempt to name the *sibling*
  word the majority was holding.

If the table accused an innocent, the impostors win outright.

### Scoring

Deliberately dumb. Per round:

- Innocents: **+1 each** if the player voted out was an impostor.
- Each impostor: **+2** if no impostor was caught.
- The caught impostor: **+1** if their steal-back guess was correct.

Running scoreboard for the current session only — no lifetime stats, no
profiles.

### Constraints falling out of "one phone at a table"

- Type large enough to read at arm's length across a table.
- High contrast; must survive direct sunlight on a café terrace.
- Large tap targets.
- **Silent by default.** Cafés are loud, and sound effects leak information.
  Haptics instead.
- Zero network calls, zero analytics, zero permissions.

## Architecture

**Stack:** Vite + React + TypeScript. Capacitor for the Android wrapper.
Self-hosted Arabic webfont (Cairo or IBM Plex Sans Arabic), subset to Arabic
plus digits, bundled — never a CDN.

**No service worker, no `vite-plugin-pwa`.** Inside a Capacitor WebView every
asset is already a local file. Omitting it deletes a dependency and an entire
class of stale-cache bugs.

**No router.** The game is a finite state machine, not a set of pages. Phases
are a discriminated union rendered by a switch. Home and settings are the only
navigable surfaces. URL-based routing would place navigation history next to
screens showing secret words.

### Modules

| Module | Job | Depends on |
|---|---|---|
| `content/` | Pack data and schema. Pure data, no logic. | nothing |
| `engine/` | Pure TS: role assignment, pair selection, scoring. No React, no DOM, no storage. Takes a **seeded RNG** as a parameter. | `content` types |
| `state/` | One reducer holding the session: players, packs, variant, phase, round, scores. Every transition is an explicit action. Fully synchronous. | `engine` |
| `ui/` | One dumb component per phase. Props in, actions out. | `state` |
| `persist/` | localStorage for settings, player names, unlocked tier, chosen packs. **Versioned schema.** | nothing |

**Data flow is one direction:** UI dispatches → reducer calls the pure engine →
new session state → re-render. The engine never touches storage or React.
Storage never touches in-round state.

The seeded RNG is load-bearing: it lets a test play ten thousand rounds and
assert invariants that would otherwise be untestable.

### Localization

**No i18n library.** The app is Derja-only; strings live in a single
`strings.ts`. Adding an i18n framework for one locale is pure overhead. RTL
comes from `dir="rtl"` on the root plus logical CSS properties
(`margin-inline`, `padding-inline`) throughout, so nothing is hand-mirrored.

### Capacitor specifics

- **The Android back gesture is the main new leak vector.** It must be
  intercepted globally via `@capacitor/app`'s back-button listener and swallowed
  during reveal and round phases.
- Plugin list stays minimal: `@capacitor/app` (back button),
  `@capacitor/haptics` (silent feedback), `@capacitor/keep-awake` (screen must
  not sleep during a three-minute discussion timer).
- **Attempt to strip `android.permission.INTERNET` from the manifest.** An app
  physically incapable of network access makes "ما يحتاجش إنترنت" provable
  rather than promised. *Open item: must be verified during implementation that
  Capacitor's WebView does not require it for local asset loading. If it breaks,
  fall back to retaining the permission while keeping zero network code.*
- Ship a **universal APK, not an AAB** — sideloading requires an APK.
- Low minSdk to cover older phones. Keep total size well under 15 MB so it sends
  over weak data.
- **No auto-update.** A visible version number in settings is required —
  otherwise three versions of the app end up arguing at the same table about
  what the rules are.
- A self-signed APK triggers an "unknown sources" install warning. Expected;
  document it for players.

### Error handling

The real failure modes are leaks and dead ends, not network.

| Failure | Handling |
|---|---|
| Too few players for chosen impostor count | Setup controls disabled with inline Derja explanation. Never an alert dialog. |
| Selected packs run out of unused pairs | Engine reports exhaustion; app offers to recycle the pool. Never a crash. |
| Old or corrupt localStorage | Validated against versioned schema; silently falls back to defaults. |
| Phone backgrounded or locked mid-reveal | `visibilitychange` listener blanks the card instantly and demands a fresh press-and-hold. |
| Mid-round state loss | Accepted by choice. Persisting secret roles to disk is itself a leak. A WebView has no pull-to-refresh, so the risk is minimal. |

## Content Model

```ts
type WordPair = { a: string; b: string };

type Pack = {
  id: string;
  name: string;                    // Derja display name
  tier: "family" | "friends";
  emoji: string;
  pairs: WordPair[];               // minimum 25 to ship
};
```

Packs live in `content/packs/*.ts` as plain data, editable by someone who never
touches the rest of the code.

`npm run validate:content` enforces, and runs in pre-commit so a bad pair cannot
land on main:

- both words present and non-empty
- Arabic script only
- no duplicate words within a pack
- no duplicate pairs across packs
- length capped so the word still fits the card at large type
- minimum 25 pairs per pack

### The craft rule for a good pair

A pair must be **close enough that one honest hint word could plausibly
describe either, and far enough apart that a careful listener eventually
notices.**

- Good: `كسكسي / مقرونة` · `الطاكسي / اللواج` · `الترجي / النادي الإفريقي` ·
  `بريك / فريكاسي` · `صفاقس / سوسة` · `القهوة / التاي`
- Too far: `كسكسي / طيّارة` — البراني is caught on the first hint. Round over.
- Too close: `قهوة / قهوة بالحليب` — nobody can ever tell, which is equally
  boring.

### Launch packs

عايلي tier, eight packs at roughly 30 pairs each:
ماكلة · بلايص · تلفزة و سينما · كرة القدم · مدرسة و باك · رمضان و أعياد ·
حيوانات · حوايج الدار

بين الأصحاب tier, two packs behind the unlock: سلاڨ و عبارات · حياة الحومة.
Cheeky, not vulgar.

### Authoring process

Claude drafts pairs; **Rayen reviews every pair before it ships.** A pair that
is subtly wrong, or that reads as Egyptian or Levantine, destroys the "made for
us" effect the app exists to sell. The validation script catches structure. Only
a native ear catches feel.

Pair-repeat avoidance within a session is held in session state (not persisted).

## Testing

The engine is pure and seeded, so most value sits in fast unit tests, written
test-first.

**Engine (Vitest, no DOM)**

- Exactly N impostors, all distinct; every player holds exactly one role.
- البراني: every impostor receives no word; all innocents share `pair.a`.
- الشبيه: every impostor receives `pair.b` and is told nothing; with two
  impostors both hold the same `pair.b`.
- Both words in play always originate from the same pair.
- No pair repeats within a session; exhaustion is reported, never thrown.
- Full scoring matrix across both variants and both impostor counts: impostor
  caught or not, crossed with steal-back guess correct or not.
- Property test: ten thousand rounds across player counts 3–12, asserting every
  invariant above.

**Reducer**

- Only legal phase transitions succeed; illegal actions are no-ops, not throws.
- The vote is unreachable until every player has revealed.
- A reveal cannot be skipped.

**Content validation** runs as a test, wired into pre-commit.

**Leak tests** — for this game, these matter more than any feature test.

- The secret word is **absent from the DOM** before press-and-hold completes,
  not merely `opacity: 0`. An unrendered word cannot be screenshotted, flashed
  during a re-render, or read by someone tilting the phone.
- `visibilitychange` to hidden blanks the card and resets the hold requirement.
- The back-button handler swallows the event during reveal and round phases.

**Acceptance test is a real table.** Five people, one phone, a café. Readable at
arm's length; nobody revealed a card by accident; nobody needed the rules
explained twice; a full round completes under five minutes. Plus one pass on a
cheap old Android and one in direct sunlight on a terrace — the two conditions
this app will actually live in.

**Deliberately not doing:** no Playwright, no Detox. For a single-device app
with no network and a small state machine, e2e tooling costs more than it
catches.

## Out of Scope

- iOS. Apple permits no sideloading; there is no path that meets the
  no-internet-sharing requirement.
- Any hosted or web-link version.
- Multi-device play, room codes, remote play, any backend.
- Accounts, profiles, lifetime stats, leaderboards.
- The additional Bakasa modes: 1v1, bomb, auction, category challenges.
- Remote or downloadable content packs. Every pack ships bundled at build time.
- Play Store publication.
- Arabizi script or a script toggle.
- Auto-update.

## Notes

The repository was initialized at `/Users/rayen/Developer/Game`. The directory
retains the name `Game` only because renaming it would move the working
directory out from under the active session; it can be renamed to `barrani`
freely afterward.
