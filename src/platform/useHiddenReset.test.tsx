import { fireEvent, render } from "@testing-library/react";
import { useHiddenReset } from "./useHiddenReset";

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
}

function Probe({ onHidden }: { onHidden: () => void }) {
  useHiddenReset(onHidden);
  return <p>probe</p>;
}

afterEach(() => setVisibility("visible"));

test("fires when the document becomes hidden", () => {
  const onHidden = vi.fn();
  render(<Probe onHidden={onHidden} />);
  setVisibility("hidden");
  fireEvent(document, new Event("visibilitychange"));
  expect(onHidden).toHaveBeenCalledTimes(1);
});

test("does not fire when the document becomes visible", () => {
  const onHidden = vi.fn();
  render(<Probe onHidden={onHidden} />);
  setVisibility("visible");
  fireEvent(document, new Event("visibilitychange"));
  expect(onHidden).not.toHaveBeenCalled();
});

test("fires on pagehide, which Android WebViews send when backgrounded", () => {
  const onHidden = vi.fn();
  render(<Probe onHidden={onHidden} />);
  fireEvent(window, new Event("pagehide"));
  expect(onHidden).toHaveBeenCalledTimes(1);
});

test("stops firing after unmount", () => {
  const onHidden = vi.fn();
  const { unmount } = render(<Probe onHidden={onHidden} />);
  unmount();
  setVisibility("hidden");
  fireEvent(document, new Event("visibilitychange"));
  expect(onHidden).not.toHaveBeenCalled();
});

test("uses the latest callback without resubscribing", () => {
  const first = vi.fn();
  const second = vi.fn();
  const { rerender } = render(<Probe onHidden={first} />);
  rerender(<Probe onHidden={second} />);
  setVisibility("hidden");
  fireEvent(document, new Event("visibilitychange"));
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
});
