import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import App from "./App";

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("App", () => {
  it("renders the initial studio shell", () => {
    render(<App />);

    expect(screen.getAllByText("Untitled Story").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Opening Image").length).toBeGreaterThan(0);
    expect(screen.getByText("Scene Inspector")).toBeTruthy();
    expect(screen.getByText("AI Dock")).toBeTruthy();
  });

  it("shows BB Studio module navigation with BB Story active by default", () => {
    render(<App />);

    expect(screen.getByText("BB Studio")).toBeTruthy();
    expect(screen.getByRole("button", { name: /BB Story/i }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Scene Inspector")).toBeTruthy();
  });

  it("switches from the story canvas to a placeholder module page", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /BB Writer/i }));

    expect(screen.getByRole("button", { name: /BB Writer/i }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Screenplay block editor")).toBeTruthy();
    expect(screen.queryByText("Scene Inspector")).toBeNull();
  });

  it("switches BB Story from the node canvas to a beat board", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Beats" }));

    expect(screen.getByText("Story Beat Board")).toBeTruthy();
    expect(screen.getAllByText("Act 1").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Opening pressure")).toBeTruthy();
    expect(screen.queryByText("Scene Inspector")).toBeNull();
  });
});
