import { registerBackHandler } from "./backButton";

const addListener = vi.fn();
const exitApp = vi.fn();

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (...args: unknown[]) => addListener(...args),
    exitApp: () => exitApp(),
  },
}));

beforeEach(() => {
  addListener.mockReset();
  exitApp.mockReset();
});

/** Captures the listener Capacitor would have registered so a test can fire it. */
function captureCallback(): () => void {
  const remove = vi.fn();
  let captured: (() => void) | undefined;
  addListener.mockImplementation((_event: string, cb: () => void) => {
    captured = cb;
    return Promise.resolve({ remove });
  });
  return () => captured!();
}

test("subscribes to the backButton event", async () => {
  addListener.mockResolvedValue({ remove: vi.fn() });
  await registerBackHandler(() => true);
  expect(addListener).toHaveBeenCalledWith("backButton", expect.any(Function));
});

test("a handler returning true swallows the gesture and does not exit", async () => {
  const fire = captureCallback();
  await registerBackHandler(() => true);
  fire();
  expect(exitApp).not.toHaveBeenCalled();
});

test("a handler returning false lets the app exit", async () => {
  const fire = captureCallback();
  await registerBackHandler(() => false);
  fire();
  expect(exitApp).toHaveBeenCalledTimes(1);
});

test("the returned disposer removes the listener", async () => {
  const remove = vi.fn();
  addListener.mockResolvedValue({ remove });
  const dispose = await registerBackHandler(() => true);
  dispose();
  expect(remove).toHaveBeenCalledTimes(1);
});

test("a failing subscription still returns a safe disposer", async () => {
  addListener.mockRejectedValue(new Error("not native"));
  const dispose = await registerBackHandler(() => true);
  expect(() => dispose()).not.toThrow();
});
