import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the initial studio shell", () => {
    render(<App />);

    expect(screen.getByText("AI Narrative Studio")).toBeTruthy();
    expect(screen.getByText("Story graph canvas loading...")).toBeTruthy();
    expect(screen.getByText("Inspector")).toBeTruthy();
  });
});
