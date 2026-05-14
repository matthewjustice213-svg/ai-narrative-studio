import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReactFlowProvider, type NodeProps } from "reactflow";
import { createSeedProject } from "../../../lib/seedProject.js";
import type { Scene } from "../../../lib/schema.js";
import { useProjectStore } from "../../../app/useProjectStore.js";
import { SceneNode } from "../SceneNode.js";

function scene(overrides: Partial<Scene> = {}) {
  return {
    ...createSeedProject().scenes[0],
    ...overrides
  } as Scene;
}

function renderSceneNode(data: Scene, selected = false) {
  const props = {
    id: data.id,
    data,
    selected,
    type: "scene",
    xPos: 0,
    yPos: 0,
    zIndex: 0,
    isConnectable: true,
    dragging: false
  } as NodeProps<Scene>;

  return render(
    <ReactFlowProvider>
      <SceneNode {...props} />
    </ReactFlowProvider>
  );
}

describe("scene node storyboard tray", () => {
  beforeEach(() => {
    useProjectStore.setState({ updateScene: vi.fn() });
  });

  it("renders an expandable storyboard image tray", () => {
    renderSceneNode(
      scene({
        title: "Cold Open",
        storyboardExpanded: true,
        storyboardImagePath: "data:image/png;base64,storyboard"
      })
    );

    expect(screen.getByRole("button", { name: "Collapse storyboard" })).toBeTruthy();
    expect(screen.getByAltText("Storyboard for Cold Open").getAttribute("src")).toBe("data:image/png;base64,storyboard");
  });

  it("toggles the storyboard tray without dragging the node", () => {
    const updateScene = vi.fn();
    useProjectStore.setState({ updateScene });

    renderSceneNode(scene({ storyboardExpanded: false }));
    fireEvent.click(screen.getByRole("button", { name: "Expand storyboard" }));

    expect(updateScene).toHaveBeenCalledWith("scene-opening", { storyboardExpanded: true });
  });
});
