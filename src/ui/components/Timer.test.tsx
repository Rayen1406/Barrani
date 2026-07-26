import { act, render, screen } from "@testing-library/react";
import { Timer } from "./Timer";

const setKeepAwake = vi.fn();
vi.mock("../../platform/keepAwake", () => ({
  setKeepAwake: (on: boolean) => setKeepAwake(on),
}));

beforeEach(() => {
  vi.useFakeTimers();
  setKeepAwake.mockReset();
});
afterEach(() => vi.useRealTimers());

test("counts down in mm:ss", () => {
  render(<Timer seconds={65} onComplete={() => {}} />);
  expect(screen.getByRole("timer")).toHaveTextContent("1:05");
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(screen.getByRole("timer")).toHaveTextContent("1:00");
});

test("calls onComplete exactly once when it reaches zero", () => {
  const onComplete = vi.fn();
  render(<Timer seconds={2} onComplete={onComplete} />);
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test("never displays a negative time", () => {
  render(<Timer seconds={1} onComplete={() => {}} />);
  act(() => {
    vi.advanceTimersByTime(10_000);
  });
  expect(screen.getByRole("timer")).toHaveTextContent("0:00");
});

test("holds the screen awake while mounted and releases on unmount", () => {
  const { unmount } = render(<Timer seconds={30} onComplete={() => {}} />);
  expect(setKeepAwake).toHaveBeenCalledWith(true);
  unmount();
  expect(setKeepAwake).toHaveBeenLastCalledWith(false);
});
