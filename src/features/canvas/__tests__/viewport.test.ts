import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { STORY_CANVAS_MIN_ZOOM } from "../StoryCanvas.js";

const storyCanvasSource = readFileSync(resolve(process.cwd(), "src/features/canvas/StoryCanvas.tsx"), "utf-8");

describe("story canvas viewport", () => {
  it("allows writers to zoom out far enough to see a large node board", () => {
    expect(STORY_CANVAS_MIN_ZOOM).toBeLessThanOrEqual(0.15);
    expect(storyCanvasSource).toContain("minZoom={STORY_CANVAS_MIN_ZOOM}");
  });
});
