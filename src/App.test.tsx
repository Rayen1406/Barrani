import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "./App";
import { strings } from "./strings";

beforeEach(() => localStorage.clear());

test("starts on the home screen", () => {
  render(<App seed={1} />);
  expect(screen.getByRole("heading", { name: strings.appName })).toBeInTheDocument();
});

test("start is disabled with no players, and says why inline", () => {
  render(<App seed={1} />);
  expect(screen.getByRole("button", { name: strings.start })).toBeDisabled();
  expect(screen.getByText(strings.needMorePlayers)).toBeInTheDocument();
});

test("navigates to players and back", () => {
  render(<App seed={1} />);
  fireEvent.click(screen.getByRole("button", { name: strings.players }));
  expect(screen.getByRole("heading", { name: strings.players })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: strings.back }));
  expect(screen.getByRole("heading", { name: strings.appName })).toBeInTheDocument();
});

test("the rules screen shows the version in Arabic-Indic digits", () => {
  render(<App seed={1} />);
  fireEvent.click(screen.getByRole("button", { name: strings.rules }));
  expect(screen.getByText(/١\.٠\.٠/)).toBeInTheDocument();
});

test("players added on the players screen persist and enable start", () => {
  render(<App seed={1} />);
  fireEvent.click(screen.getByRole("button", { name: strings.players }));

  const input = screen.getByPlaceholderText(strings.playerNamePlaceholder);
  for (const name of ["سامي", "أمين", "ليلى"]) {
    fireEvent.change(input, { target: { value: name } });
    fireEvent.click(screen.getByRole("button", { name: strings.addPlayer }));
  }

  fireEvent.click(screen.getByRole("button", { name: strings.back }));
  expect(screen.getByRole("button", { name: strings.start })).toBeEnabled();
});

test("document direction is RTL", () => {
  render(<App seed={1} />);
  expect(document.documentElement.dir).toBe("rtl");
});
