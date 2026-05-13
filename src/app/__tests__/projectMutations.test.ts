import { describe, expect, it } from "vitest";
import { createSeedProject } from "../../lib/seedProject.js";
import {
  addStoryBeat,
  createGroupBoxAroundNodes,
  deleteStoryBeat,
  deleteGraphNode,
  moveStoryBeat,
  reorderStoryBeat,
  updateStoryBeat,
  setGraphNodeColor
} from "../projectMutations.js";

describe("project mutations", () => {
  it("deletes a scene and removes dependent edges, notes, and character links", () => {
    const project = createSeedProject();
    const withReferences = {
      ...project,
      aiNotes: [
        {
          id: "note-scene",
          sceneId: "scene-opening",
          personaId: "persona-reader",
          task: "scene_notes" as const,
          prompt: "Prompt",
          response: "Response",
          model: "gpt-5.4-mini",
          createdAt: "2026-05-09T00:00:00.000Z"
        }
      ],
      characters: project.characters.map((character) => ({
        ...character,
        linkedSceneIds: ["scene-opening"]
      })),
      personas: [
        {
          id: "persona-reader",
          name: "Reader",
          role: "Story Reader",
          specialty: "structure",
          tone: "direct",
          avatarPath: null,
          visible: true,
          sourceSoulPath: "souls/reader.md",
          allowedTasks: ["scene_notes" as const],
          bodyMarkdown: ""
        }
      ]
    };

    const result = deleteGraphNode(withReferences, { type: "scene", id: "scene-opening" });

    expect(result.scenes.some((scene) => scene.id === "scene-opening")).toBe(false);
    expect(result.edges.some((edge) => edge.source === "scene-opening" || edge.target === "scene-opening")).toBe(false);
    expect(result.aiNotes).toEqual([]);
    expect(result.characters[0].linkedSceneIds).toEqual([]);
  });

  it("deletes a character and removes dependent edges and scene links", () => {
    const project = createSeedProject();
    const withReferences = {
      ...project,
      scenes: project.scenes.map((scene) => ({
        ...scene,
        linkedCharacterIds: ["char-fries"]
      })),
      edges: [
        ...project.edges,
        {
          id: "edge-char",
          source: "char-fries",
          target: "scene-opening",
          type: "character_relationship" as const,
          label: "appears in",
          color: "#ff4fd8"
        }
      ]
    };

    const result = deleteGraphNode(withReferences, { type: "character", id: "char-fries" });

    expect(result.characters.some((character) => character.id === "char-fries")).toBe(false);
    expect(result.edges.some((edge) => edge.source === "char-fries" || edge.target === "char-fries")).toBe(false);
    expect(result.scenes[0].linkedCharacterIds).toEqual([]);
  });

  it("sets scene and character node colors", () => {
    const project = createSeedProject();

    const withSceneColor = setGraphNodeColor(project, { type: "scene", id: "scene-opening", color: "#38d8ff" });
    const withCharacterColor = setGraphNodeColor(withSceneColor, {
      type: "character",
      id: "char-fries",
      color: "#ff4fd8"
    });

    expect(withCharacterColor.scenes.find((scene) => scene.id === "scene-opening")?.color).toBe("#38d8ff");
    expect(withCharacterColor.characters.find((character) => character.id === "char-fries")?.color).toBe("#ff4fd8");
  });

  it("creates a labeled group box around all nodes of a type", () => {
    const project = createSeedProject();

    const result = createGroupBoxAroundNodes(project, {
      id: "group-story",
      nodeType: "scene",
      title: "Story",
      color: "#38d8ff"
    });

    expect(result.groupBoxes).toHaveLength(1);
    expect(result.groupBoxes[0]).toMatchObject({
      id: "group-story",
      title: "Story",
      color: "#38d8ff"
    });
    expect(result.groupBoxes[0].position.x).toBeLessThan(project.scenes[0].position.x);
    expect(result.groupBoxes[0].width).toBeGreaterThan(700);
  });

  it("adds, updates, moves, reorders, and deletes story beat cards", () => {
    const project = { ...createSeedProject(), storyBeats: [] };

    const withBeat = addStoryBeat(project, {
      id: "beat-new",
      columnId: "act_1"
    });
    const updated = updateStoryBeat(withBeat, {
      id: "beat-new",
      title: "Inciting mess",
      summary: "A tiny problem becomes the story engine.",
      color: "#ffb15c",
      tags: ["setup", "pressure"]
    });
    const moved = moveStoryBeat(updated, { id: "beat-new", columnId: "act_2a" });
    const reordered = reorderStoryBeat(
      {
        ...moved,
        storyBeats: [
          ...moved.storyBeats,
          {
            id: "beat-second",
            title: "Second beat",
            summary: "",
            columnId: "act_2a" as const,
            color: null,
            tags: [],
            order: 1
          }
        ]
      },
      { id: "beat-second", direction: "up" }
    );
    const deleted = deleteStoryBeat(reordered, "beat-new");

    expect(withBeat.storyBeats[0]).toMatchObject({
      id: "beat-new",
      title: "New Beat",
      columnId: "act_1",
      order: 0
    });
    expect(updated.storyBeats[0].tags).toEqual(["setup", "pressure"]);
    expect(moved.storyBeats[0]).toMatchObject({ columnId: "act_2a", order: 0 });
    expect(reordered.storyBeats.find((beat) => beat.id === "beat-second")?.order).toBe(0);
    expect(deleted.storyBeats.map((beat) => beat.id)).toEqual(["beat-second"]);
  });
});
