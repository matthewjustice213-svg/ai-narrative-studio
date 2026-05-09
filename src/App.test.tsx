import { render, screen } from "@testing-library/react";
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

    expect(screen.getByText("Untitled Story")).toBeTruthy();
    expect(screen.getAllByText("Opening Image").length).toBeGreaterThan(0);
    expect(screen.getByText("Scene Inspector")).toBeTruthy();
    expect(screen.getByText("AI Dock")).toBeTruthy();
  });
});
