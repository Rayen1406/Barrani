import { act, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";
import { PERSIST_KEY } from "../persist/schema";
import { strings } from "../strings";

const HOLD_MS = 600;
const NAMES = ["سامي", "أمين", "ليلى", "كريم"];

function setup(timerSeconds: number | null = null) {
  localStorage.setItem(
    PERSIST_KEY,
    JSON.stringify({
      version: 1,
      playerNames: NAMES,
      selectedPackIds: ["makla"],
      friendsUnlocked: false,
      variantSetting: "barrani",
      impostorCount: 1,
      timerSeconds,
    }),
  );
  return render(<App seed={7} />);
}

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function holdToReveal() {
  const trigger = screen.getByRole("button", { name: strings.holdToReveal });
  fireEvent.touchStart(trigger);
  act(() => {
    vi.advanceTimersByTime(HOLD_MS);
  });
}

/** Walks every seat through handoff -> hold -> عدّي. Returns who was البراني. */
function revealAll(): string {
  let impostor = "";
  for (const name of NAMES) {
    click(`${strings.iAm} ${name}`);
    holdToReveal();
    if ((document.body.textContent ?? "").includes(strings.youAreBarrani)) impostor = name;
    click(strings.next);
  }
  return impostor;
}

/** Plays a round up to the vote and returns the name of البراني. */
function reachVote(): string {
  setup();
  click(strings.start);
  const impostor = revealAll();
  for (let i = 0; i < NAMES.length * 2; i++) click(strings.saidIt);
  click(strings.startVote);
  return impostor;
}

/** Reads a player's score off the scoreboard row, converting Arabic-Indic digits back. */
function scoreOf(name: string): number {
  const row = screen.getByText(name).closest("li")!;
  const digits = (row.textContent ?? "").replace(/[^٠-٩]/gu, "");
  return Number(digits.replace(/[٠-٩]/gu, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))));
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

test("the handoff screen names the player whose turn it is", () => {
  setup();
  click(strings.start);
  expect(screen.getByText(strings.handoffTo)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: `${strings.iAm} سامي` })).toBeInTheDocument();
});

test("no word is in the DOM before the hold completes", () => {
  setup();
  click(strings.start);
  click(`${strings.iAm} سامي`);
  expect(document.body.textContent).not.toContain(strings.yourWord);
  expect(document.body.textContent).not.toContain(strings.youAreBarrani);
});

test("holding reveals a word or the barrani badge, then عدّي advances", () => {
  setup();
  click(strings.start);
  click(`${strings.iAm} سامي`);
  holdToReveal();

  const revealed = document.body.textContent ?? "";
  expect(revealed.includes(strings.yourWord) || revealed.includes(strings.youAreBarrani)).toBe(true);

  click(strings.next);
  expect(screen.getByRole("button", { name: `${strings.iAm} أمين` })).toBeInTheDocument();
});

test("exactly one of four players sees the barrani badge", () => {
  setup();
  click(strings.start);

  let barraniCount = 0;
  for (const name of NAMES) {
    click(`${strings.iAm} ${name}`);
    holdToReveal();
    if ((document.body.textContent ?? "").includes(strings.youAreBarrani)) barraniCount += 1;
    click(strings.next);
  }
  expect(barraniCount).toBe(1);
});

test("after every reveal, hints begin", () => {
  setup();
  click(strings.start);
  revealAll();
  expect(screen.getByText(strings.hintsTitle)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: strings.saidIt })).toBeInTheDocument();
});

test("with no timer configured, discussion offers the vote button and no clock", () => {
  setup(null);
  click(strings.start);
  revealAll();
  for (let i = 0; i < NAMES.length * 2; i++) click(strings.saidIt);
  expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: strings.startVote })).toBeInTheDocument();
});

test("the discussion timer appears and counts when one is configured", () => {
  setup(60);
  click(strings.start);
  revealAll();
  for (let i = 0; i < NAMES.length * 2; i++) click(strings.saidIt);
  expect(screen.getByRole("timer")).toHaveTextContent("١:٠٠");
});

test("the vote screen offers every player", () => {
  reachVote();
  expect(screen.getByText(strings.voteTitle)).toBeInTheDocument();
  for (const name of NAMES) {
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  }
});

test("accusing an innocent shows the missed result and offers no steal-back", () => {
  const impostor = reachVote();
  const innocent = NAMES.find((name) => name !== impostor)!;

  click(innocent);

  expect(screen.getByText(strings.missed)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: strings.guessedRight })).not.toBeInTheDocument();
  expect(screen.getByText(impostor)).toBeInTheDocument();
});

test("catching البراني opens the steal-back before the scoreboard", () => {
  const impostor = reachVote();

  click(impostor);

  expect(screen.getByText(strings.caught)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: strings.guessedRight })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: strings.scores })).not.toBeInTheDocument();

  click(strings.guessedWrong);
  expect(screen.getByRole("button", { name: strings.scores })).toBeInTheDocument();
});

test("a caught البراني who guesses right scores, and so does everyone else", () => {
  const impostor = reachVote();
  click(impostor);
  click(strings.guessedRight);
  click(strings.scores);

  for (const name of NAMES) expect(scoreOf(name)).toBe(1);
});

test("a caught البراني who guesses wrong scores nothing", () => {
  const impostor = reachVote();
  click(impostor);
  click(strings.guessedWrong);
  click(strings.scores);

  expect(scoreOf(impostor)).toBe(0);
  for (const name of NAMES.filter((n) => n !== impostor)) expect(scoreOf(name)).toBe(1);
});

test("a missed vote scores البراني two and the table nothing", () => {
  const impostor = reachVote();
  const innocent = NAMES.find((name) => name !== impostor)!;
  click(innocent);
  click(strings.scores);

  expect(scoreOf(impostor)).toBe(2);
  for (const name of NAMES.filter((n) => n !== impostor)) expect(scoreOf(name)).toBe(0);
});

test("the scoreboard offers another round and ending the game", () => {
  const impostor = reachVote();
  click(impostor);
  click(strings.guessedWrong);
  click(strings.scores);

  expect(screen.getByRole("button", { name: strings.nextRound })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: strings.endGame })).toBeInTheDocument();

  click(strings.nextRound);
  expect(screen.getByText(strings.handoffTo)).toBeInTheDocument();
});

test("ending the game returns home and clears the scoreboard", () => {
  const impostor = reachVote();
  click(impostor);
  click(strings.guessedWrong);
  click(strings.scores);
  click(strings.endGame);

  expect(screen.getByRole("heading", { name: strings.appName })).toBeInTheDocument();
});
