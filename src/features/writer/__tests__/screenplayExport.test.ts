import { describe, expect, it } from "vitest";
import { createSeedProject } from "../../../lib/seedProject.js";
import { exportProjectMarkdown } from "../screenplayExport.js";

describe("exportProjectMarkdown", () => {
  it("exports project scenes as screenplay markdown", () => {
    const markdown = exportProjectMarkdown(createSeedProject());

    expect(markdown).toContain("# Untitled Story");
    expect(markdown).toContain("## Opening Image");
    expect(markdown).toContain("The protagonist tries to look in control");
    expect(markdown).toContain("```screenplay\nINT. FOOD TRUCK - NIGHT");
    expect(markdown).toContain("## Bad News Arrives");
  });
});
