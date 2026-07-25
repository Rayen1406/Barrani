import { render, screen } from "@testing-library/react";
import { App } from "./App";
import { strings } from "./strings";

test("renders the game title in Derja", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: strings.appName })).toBeInTheDocument();
});

test("document direction is RTL", () => {
  render(<App />);
  expect(document.documentElement.dir).toBe("rtl");
});
