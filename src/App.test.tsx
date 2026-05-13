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

    fireEvent.click(screen.getByRole("button", { name: /BB Director/i }));

    expect(screen.getByRole("button", { name: /BB Director/i }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Director board")).toBeTruthy();
    expect(screen.queryByText("Scene Inspector")).toBeNull();
  });

  it("opens BB Writer as a screenplay workspace", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /BB Writer/i }));

    expect(screen.getByRole("button", { name: /BB Writer/i }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Scene Script")).toBeTruthy();
    expect(screen.getByLabelText("Screenplay Text")).toBeTruthy();
    expect(screen.getByDisplayValue(/INT. FOOD TRUCK - NIGHT/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export Markdown" })).toBeTruthy();
    expect(screen.queryByText("Scene Inspector")).toBeNull();
  });

  it("exports the current BB Writer draft to markdown", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /BB Writer/i }));
    fireEvent.change(screen.getByLabelText("Screenplay Text"), {
      target: { value: "INT. TEST KITCHEN - DAY\n\nFries finds a new problem." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Export Markdown" }));

    expect((screen.getByLabelText("Markdown Export") as HTMLTextAreaElement).value).toContain("Fries finds a new problem.");
  });

  it("switches BB Story from the node canvas to a beat board", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Beats" }));

    expect(screen.getByText("Story Beat Board")).toBeTruthy();
    expect(screen.getAllByText("Act 1").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Opening pressure")).toBeTruthy();
    expect(screen.queryByText("Scene Inspector")).toBeNull();
  });

  it("renders Photoshop-style resize handles for the docked workspace", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Canvas" }));

    expect(screen.getByRole("separator", { name: "Resize project sidebar" })).toBeTruthy();
    expect(screen.getByRole("separator", { name: "Resize right dock" })).toBeTruthy();
    expect(screen.getByRole("separator", { name: "Resize inspector panel" })).toBeTruthy();
    expect(screen.getByRole("separator", { name: "Resize writers room panel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset Layout" })).toBeTruthy();
  });
});
