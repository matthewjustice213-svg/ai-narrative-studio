import { describe, expect, it } from "vitest";
import { projectSchema, soulFrontmatterSchema } from "../schema";
import { createSeedProject } from "../seedProject";

describe("project schema", () => {
  it("accepts the seed story graph", () => {
    const parsed = projectSchema.parse(createSeedProject());
    expect(parsed.scenes).toHaveLength(3);
    expect(parsed.edges[0].type).toBe("progression");
    expect(parsed.settings.model).toBe("gpt-5.4-mini");
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
