import { describe, expect, it } from "vitest";
import { clampStudioLayout, defaultStudioLayout } from "../studioLayout.js";

describe("studio layout", () => {
  it("clamps dock sizes so panels stay usable", () => {
    const layout = clampStudioLayout(defaultStudioLayout, {
      projectPanelWidth: 80,
      rightPanelWidth: 900,
      inspectorHeight: 80,
      writersHeight: 90
    });

    expect(layout.projectPanelWidth).toBe(220);
    expect(layout.rightPanelWidth).toBe(620);
    expect(layout.inspectorHeight).toBe(180);
    expect(layout.writersHeight).toBe(180);
  });

  it("preserves unchanged layout dimensions", () => {
    const layout = clampStudioLayout(defaultStudioLayout, {
      writersHeight: 420
    });

    expect(layout.projectPanelWidth).toBe(defaultStudioLayout.projectPanelWidth);
    expect(layout.rightPanelWidth).toBe(defaultStudioLayout.rightPanelWidth);
    expect(layout.writersHeight).toBe(420);
  });
});
