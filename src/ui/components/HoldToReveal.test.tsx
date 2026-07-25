import { act, fireEvent, render, screen } from "@testing-library/react";
import { HoldToReveal } from "./HoldToReveal";

const SECRET = "كسكسي";

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  setVisibility("visible");
});

function renderCard(holdMs = 600) {
  return render(
    <HoldToReveal label="شدّ" holdMs={holdMs}>
      <p>{SECRET}</p>
    </HoldToReveal>,
  );
}

function hold(ms: number) {
  const trigger = screen.getByRole("button");
  fireEvent.touchStart(trigger);
  act(() => {
    vi.advanceTimersByTime(ms);
  });
  return trigger;
}

test("the secret is absent from the DOM before any interaction", () => {
  renderCard();
  expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  expect(document.body.textContent).not.toContain(SECRET);
});

test("the secret is still absent partway through the hold", () => {
  renderCard(600);
  hold(300);
  expect(document.body.textContent).not.toContain(SECRET);
});

test("the secret appears only after the full hold", () => {
  renderCard(600);
  hold(600);
  expect(screen.getByText(SECRET)).toBeInTheDocument();
});

test("releasing early never reveals the secret", () => {
  renderCard(600);
  const trigger = hold(300);
  fireEvent.touchEnd(trigger);
  act(() => {
    vi.advanceTimersByTime(2000);
  });
  expect(document.body.textContent).not.toContain(SECRET);
});

test("cancelling the touch cancels the hold", () => {
  renderCard(600);
  const trigger = hold(300);
  fireEvent.touchCancel(trigger);
  act(() => {
    vi.advanceTimersByTime(2000);
  });
  expect(document.body.textContent).not.toContain(SECRET);
});

test("mouse hold works too, so the game is testable in a desktop browser", () => {
  renderCard(600);
  const trigger = screen.getByRole("button");
  fireEvent.mouseDown(trigger);
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(screen.getByText(SECRET)).toBeInTheDocument();
});

test("backgrounding the app removes a revealed secret from the DOM", () => {
  renderCard(600);
  hold(600);
  expect(screen.getByText(SECRET)).toBeInTheDocument();

  setVisibility("hidden");
  act(() => {
    fireEvent(document, new Event("visibilitychange"));
  });

  expect(document.body.textContent).not.toContain(SECRET);
});

test("after backgrounding, a fresh full hold is required again", () => {
  renderCard(600);
  hold(600);
  setVisibility("hidden");
  act(() => {
    fireEvent(document, new Event("visibilitychange"));
  });
  setVisibility("visible");

  hold(300);
  expect(document.body.textContent).not.toContain(SECRET);

  const trigger = screen.getByRole("button");
  fireEvent.touchStart(trigger);
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(screen.getByText(SECRET)).toBeInTheDocument();
});

test("onRevealed fires exactly once per reveal", () => {
  const onRevealed = vi.fn();
  render(
    <HoldToReveal label="شدّ" holdMs={400} onRevealed={onRevealed}>
      <p>{SECRET}</p>
    </HoldToReveal>,
  );
  hold(400);
  act(() => {
    vi.advanceTimersByTime(2000);
  });
  expect(onRevealed).toHaveBeenCalledTimes(1);
});
