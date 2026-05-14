import { describe, expect, it } from "vitest";
import { projectSchema, soulFrontmatterSchema } from "../schema";
import { createSeedProject } from "../seedProject";

describe("project schema", () => {
  function withoutColor<T extends { color?: unknown }>(item: T) {
    const copy = { ...item };
    delete copy.color;
    return copy;
  }

  it("accepts the seed story graph", () => {
    const parsed = projectSchema.parse(createSeedProject());
    expect(parsed.scenes).toHaveLength(3);
    expect(parsed.storyBeats).toHaveLength(3);
    expect(parsed.edges[0].type).toBe("progression");
    expect(parsed.settings.model).toBe("gpt-5.4-mini");
  });

  it("backfills visual organization defaults on older project documents", () => {
    const project = createSeedProject();
    const legacyProject = {
      ...project,
      pitch: undefined,
      references: undefined,
      storyBeats: undefined,
      scenes: project.scenes.map((scene) => {
        const copy = withoutColor(scene);
        delete (copy as Partial<typeof scene>).directorNotes;
        delete (copy as Partial<typeof scene>).cameraNotes;
        delete (copy as Partial<typeof scene>).shotList;
        delete (copy as Partial<typeof scene>).lightingNotes;
        delete (copy as Partial<typeof scene>).soundNotes;
        delete (copy as Partial<typeof scene>).storyboardImagePath;
        delete (copy as Partial<typeof scene>).storyboardExpanded;
        return copy;
      }),
      characters: project.characters.map(withoutColor)
    };

    const parsed = projectSchema.parse(legacyProject);

    expect(parsed.storyBeats).toEqual([]);
    expect(parsed.references).toEqual([]);
    expect(parsed.pitch).toEqual({
      logline: "",
      synopsis: "",
      tone: "",
      audience: "",
      comps: [],
      oneSheetNotes: ""
    });
    expect(parsed.groupBoxes).toEqual([]);
    expect(parsed.scenes[0].color).toBeNull();
    expect(parsed.scenes[0].cameraNotes).toBe("");
    expect(parsed.scenes[0].shotList).toBe("");
    expect(parsed.scenes[0].storyboardImagePath).toBeNull();
    expect(parsed.scenes[0].storyboardExpanded).toBe(false);
    expect(parsed.characters[0].color).toBeNull();
  });

  it("accepts story beat cards across structure columns", () => {
    const project = createSeedProject();

    const parsed = projectSchema.parse({
      ...project,
      storyBeats: [
        {
          id: "beat-opening-pressure",
          title: "Opening pressure",
          summary: "Fries tries to look in control.",
          columnId: "act_1",
          color: "#38d8ff",
          tags: ["setup"],
          order: 0
        }
      ]
    });

    expect(parsed.storyBeats[0].columnId).toBe("act_1");
    expect(parsed.storyBeats[0].tags).toEqual(["setup"]);
  });

  it("accepts labeled group boxes for corralling story nodes", () => {
    const project = createSeedProject();

    const parsed = projectSchema.parse({
      ...project,
      groupBoxes: [
        {
          id: "group-story",
          title: "Story",
          color: "#38d8ff",
          position: { x: 40, y: 40 },
          width: 880,
          height: 320
        }
      ]
    });

    expect(parsed.groupBoxes[0].title).toBe("Story");
    expect(parsed.groupBoxes[0].width).toBe(880);
  });

  it("rejects a soul frontmatter object without a required name", () => {
    expect(() =>
      soulFrontmatterSchema.parse({
        id: "voice-doctor",
        role: "Dialogue Doctor",
        specialty: "subtext",
        tone: "direct",
        allowed_tasks: ["dialogue_notes"]
      })
    ).toThrow();
  });

  it("rejects a dangling edge reference", () => {
    const project = createSeedProject();
    project.edges[0].target = "scene-missing";

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects duplicate scene IDs", () => {
    const project = createSeedProject();
    project.scenes[1].id = project.scenes[0].id;

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects duplicate character IDs", () => {
    const project = createSeedProject();
    project.characters.push({
      ...project.characters[0],
      position: { x: 500, y: 620 }
    });

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects scene and character IDs that collide", () => {
    const project = createSeedProject();
    project.characters[0].id = "scene-opening";
    project.scenes.forEach((scene) => {
      scene.linkedCharacterIds = ["scene-opening"];
    });

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects duplicate edge IDs", () => {
    const project = createSeedProject();
    project.edges[1].id = project.edges[0].id;

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects duplicate group box IDs", () => {
    const project = createSeedProject();
    const groupBox = {
      id: "group-story",
      title: "Story",
      color: "#38d8ff",
      position: { x: 40, y: 40 },
      width: 880,
      height: 320
    };

    expect(() =>
      projectSchema.parse({
        ...project,
        groupBoxes: [groupBox, { ...groupBox, title: "Characters" }]
      })
    ).toThrow();
  });

  it("rejects duplicate story beat IDs", () => {
    const project = createSeedProject();
    const beat = {
      id: "beat-setup",
      title: "Setup",
      summary: "The first promise.",
      columnId: "act_1",
      color: null,
      tags: [],
      order: 0
    };

    expect(() =>
      projectSchema.parse({
        ...project,
        storyBeats: [beat, { ...beat, title: "Second setup", order: 1 }]
      })
    ).toThrow();
  });

  it("rejects duplicate persona IDs", () => {
    const project = createSeedProject();
    project.personas.push(
      {
        id: "persona-critic",
        name: "Critic",
        role: "Story Critic",
        specialty: "structure",
        tone: "direct",
        avatarPath: null,
        visible: true,
        sourceSoulPath: "souls/critic.md",
        allowedTasks: ["scene_notes"],
        bodyMarkdown: ""
      },
      {
        id: "persona-critic",
        name: "Second Critic",
        role: "Story Critic",
        specialty: "structure",
        tone: "direct",
        avatarPath: null,
        visible: true,
        sourceSoulPath: "souls/second-critic.md",
        allowedTasks: ["scene_notes"],
        bodyMarkdown: ""
      }
    );

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects duplicate AI note IDs", () => {
    const project = createSeedProject();
    project.personas.push({
      id: "persona-critic",
      name: "Critic",
      role: "Story Critic",
      specialty: "structure",
      tone: "direct",
      avatarPath: null,
      visible: true,
      sourceSoulPath: "souls/critic.md",
      allowedTasks: ["scene_notes"],
      bodyMarkdown: ""
    });
    project.aiNotes.push(
      {
        id: "note-1",
        sceneId: "scene-opening",
        personaId: "persona-critic",
        task: "scene_notes",
        prompt: "What works?",
        response: "The pressure is clear.",
        model: "gpt-5.4-mini",
        createdAt: new Date().toISOString()
      },
      {
        id: "note-1",
        sceneId: "scene-complication",
        personaId: "persona-critic",
        task: "scene_notes",
        prompt: "What escalates?",
        response: "The public embarrassment.",
        model: "gpt-5.4-mini",
        createdAt: new Date().toISOString()
      }
    );

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects a scene linked to a missing character", () => {
    const project = createSeedProject();
    project.scenes[0].linkedCharacterIds = ["char-missing"];

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects a character linked to a missing scene", () => {
    const project = createSeedProject();
    project.characters[0].linkedSceneIds = ["scene-missing"];

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects an AI note linked to a missing scene", () => {
    const project = createSeedProject();
    project.personas.push({
      id: "persona-critic",
      name: "Critic",
      role: "Story Critic",
      specialty: "structure",
      tone: "direct",
      avatarPath: null,
      visible: true,
      sourceSoulPath: "souls/critic.md",
      allowedTasks: ["scene_notes"],
      bodyMarkdown: ""
    });
    project.aiNotes.push({
      id: "note-1",
      sceneId: "scene-missing",
      personaId: "persona-critic",
      task: "scene_notes",
      prompt: "What works?",
      response: "The pressure is clear.",
      model: "gpt-5.4-mini",
      createdAt: new Date().toISOString()
    });

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects an AI note linked to a missing persona", () => {
    const project = createSeedProject();
    project.aiNotes.push({
      id: "note-1",
      sceneId: "scene-opening",
      personaId: "persona-missing",
      task: "scene_notes",
      prompt: "What works?",
      response: "The pressure is clear.",
      model: "gpt-5.4-mini",
      createdAt: new Date().toISOString()
    });

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects an invalid project createdAt timestamp", () => {
    const project = createSeedProject();
    project.createdAt = "not-a-date";

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects an invalid project updatedAt timestamp", () => {
    const project = createSeedProject();
    project.updatedAt = "not-a-date";

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects an invalid AI note createdAt timestamp", () => {
    const project = createSeedProject();
    project.personas.push({
      id: "persona-critic",
      name: "Critic",
      role: "Story Critic",
      specialty: "structure",
      tone: "direct",
      avatarPath: null,
      visible: true,
      sourceSoulPath: "souls/critic.md",
      allowedTasks: ["scene_notes"],
      bodyMarkdown: ""
    });
    project.aiNotes.push({
      id: "note-1",
      sceneId: "scene-opening",
      personaId: "persona-critic",
      task: "scene_notes",
      prompt: "What works?",
      response: "The pressure is clear.",
      model: "gpt-5.4-mini",
      createdAt: "not-a-date"
    });

    expect(() => projectSchema.parse(project)).toThrow();
  });

  it("rejects invalid enum values", () => {
    const project = createSeedProject();
    const invalidProject = {
      ...project,
      edges: [{ ...project.edges[0], type: "mystery_link" }, ...project.edges.slice(1)]
    };

    expect(() => projectSchema.parse(invalidProject)).toThrow();
  });
});
