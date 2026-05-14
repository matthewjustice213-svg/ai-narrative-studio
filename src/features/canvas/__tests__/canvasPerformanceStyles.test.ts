import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf-8");

function cssBlock(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return styles.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

describe("canvas performance styles", () => {
  it("promotes React Flow nodes and contains expensive node painting", () => {
    expect(cssBlock(".react-flow__node")).toContain("will-change: transform");
    expect(cssBlock(".story-node")).toContain("backface-visibility: hidden");
    expect(cssBlock(".group-box-node")).toContain("backface-visibility: hidden");
    expect(styles).toContain(".react-flow__node.dragging .story-node");
    expect(styles).toContain("box-shadow: none");
  });
});
