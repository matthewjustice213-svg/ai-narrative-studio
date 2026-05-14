import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf-8");

function cssBlock(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return styles.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

describe("responsive studio layout styles", () => {
  it("keeps the module tab strip anchored from the left", () => {
    const moduleTabs = cssBlock(".module-tabs");

    expect(moduleTabs).toContain("justify-content: flex-start");
    expect(moduleTabs).toContain("overflow-x: auto");
  });

  it("uses shrinkable three-column module workspaces", () => {
    expect(cssBlock(".writer-workspace")).toContain(
      "grid-template-columns: minmax(210px, 0.75fr) minmax(300px, 1.35fr) minmax(240px, 0.9fr);"
    );
    expect(cssBlock(".characters-workspace")).toContain(
      "grid-template-columns: minmax(210px, 0.75fr) minmax(300px, 1.35fr) minmax(240px, 0.9fr);"
    );
    expect(cssBlock(".director-workspace")).toContain(
      "grid-template-columns: minmax(210px, 0.75fr) minmax(310px, 1.35fr) minmax(240px, 0.9fr);"
    );
  });
});
