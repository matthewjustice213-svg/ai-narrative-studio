import { describe, expect, it } from "vitest";
import type { NodeProps } from "reactflow";
import type { Character, GroupBox, Scene } from "../../../lib/schema.js";
import { areCharacterNodePropsEqual } from "../CharacterNode.js";
import { areGroupBoxNodePropsEqual } from "../GroupBoxNode.js";
import { areSceneNodePropsEqual } from "../SceneNode.js";

const scene = { id: "scene-a", title: "A" } as Scene;
const character = { id: "char-a", name: "A" } as Character;
const groupBox = { id: "group-a", title: "A" } as GroupBox;

describe("canvas node render performance", () => {
  it("skips scene node rerenders when only drag metadata changes", () => {
    expect(
      areSceneNodePropsEqual(
        { data: scene, selected: true, dragging: false } as NodeProps<Scene>,
        { data: scene, selected: true, dragging: true } as NodeProps<Scene>
      )
    ).toBe(true);

    expect(
      areSceneNodePropsEqual(
        { data: scene, selected: false } as NodeProps<Scene>,
        { data: scene, selected: true } as NodeProps<Scene>
      )
    ).toBe(false);
  });

  it("skips character node rerenders when only drag metadata changes", () => {
    expect(
      areCharacterNodePropsEqual(
        { data: character, selected: false, dragging: false } as NodeProps<Character>,
        { data: character, selected: false, dragging: true } as NodeProps<Character>
      )
    ).toBe(true);
  });

  it("skips group box rerenders when only drag metadata changes", () => {
    expect(
      areGroupBoxNodePropsEqual(
        { data: groupBox, selected: false, dragging: false } as NodeProps<GroupBox>,
        { data: groupBox, selected: false, dragging: true } as NodeProps<GroupBox>
      )
    ).toBe(true);
  });
});
