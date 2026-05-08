import { describe, expect, it } from "vitest";
import { createSeedProject } from "../../src/lib/seedProject.js";
import type { Persona } from "../../src/lib/schema.js";
import { buildPersonaPrompt, runVisibleWriters } from "../writersRoom.js";

const ruth: Persona = {
  id: "persona-ruth",
  name: "Ruth",
  role: "Dialogue Punch-Up Writer",
  specialty: "grounded awkward comedy",
  tone: "blunt, practical, dry",
  avatarPath: null,
  visible: true,
  sourceSoulPath: "C:/story/writers-room/ruth.soul.md",
  allowedTasks: ["dialogue_notes", "punch_up"],
  bodyMarkdown: "## Taste\nGrounded comedy, uncomfortable silence, tiny status shifts."
};

const hiddenPersona: Persona = {
  ...ruth,
  id: "persona-hidden",
  name: "Hidden Writer",
  visible: false
};

const conflictPersona: Persona = {
  ...ruth,
  id: "persona-conflict",
  name: "Conflict Writer",
  allowedTasks: ["scene_conflict"]
};

const mark: Persona = {
  ...ruth,
  id: "persona-mark",
  name: "Mark",
  role: "Story Editor",
  allowedTasks: ["punch_up"]
};

describe("writers room", () => {
  it("builds prompts with scene, persona, soul, and linked character context", () => {
    const project = createSeedProject();
    const scene = project.scenes[0];
    const prompt = buildPersonaPrompt(project, scene, ruth, "punch_up");

    expect(prompt).toContain("Persona: Ruth");
    expect(prompt).toContain("Role: Dialogue Punch-Up Writer");
    expect(prompt).toContain("Specialty: grounded awkward comedy");
    expect(prompt).toContain("Tone: blunt, practical, dry");
    expect(prompt).toContain("## Taste");
    expect(prompt).toContain("Task: punch_up");
    expect(prompt).toContain("Project Title: Untitled Story");
    expect(prompt).toContain("Selected Scene: Opening Image");
    expect(prompt).toContain(scene.summary);
    expect(prompt).toContain("Emotional Tone: anxious comedy");
    expect(prompt).toContain("Runtime Estimate: 2 minutes");
    expect(prompt).toContain("Tags: opening, pressure");
    expect(prompt).toContain("Character: Fries");
    expect(prompt).toContain("Bio: A fast-talking creator who treats every small failure like a public trial.");
    expect(prompt).toContain("Dialogue Style: Deflects with jokes before admitting the truth.");
    expect(prompt).toContain("Introduce pressure, status anxiety, and comic denial.");
    expect(prompt).toContain("INT. FOOD TRUCK - NIGHT");
    expect(prompt).toContain("Response Format:");
  });

  it("runs only visible personas that allow the requested task", async () => {
    const project = createSeedProject();
    project.personas = [ruth, hiddenPersona, conflictPersona];
    const calls: Array<{ personaId: string; prompt: string; model: string }> = [];

    const result = await runVisibleWriters({
      project,
      sceneId: "scene-opening",
      task: "punch_up",
      model: "gpt-5.4-mini",
      generate: async ({ persona, prompt, model }) => {
        calls.push({ personaId: persona.id, prompt, model });
        return `Response from ${persona.name}`;
      }
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      personaId: "persona-ruth",
      model: "gpt-5.4-mini"
    });
    expect(calls[0].prompt).toContain("Task: punch_up");
    expect(result.errors).toEqual([]);
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]).toMatchObject({
      sceneId: "scene-opening",
      personaId: "persona-ruth",
      task: "punch_up",
      response: "Response from Ruth",
      model: "gpt-5.4-mini"
    });
    expect(result.notes[0].id).toEqual(expect.any(String));
    expect(result.notes[0].prompt).toBe(calls[0].prompt);
    expect(new Date(result.notes[0].createdAt).toISOString()).toBe(result.notes[0].createdAt);
  });

  it("preserves successful notes when another eligible persona fails", async () => {
    const project = createSeedProject();
    project.personas = [ruth, mark];

    const result = await runVisibleWriters({
      project,
      sceneId: "scene-opening",
      task: "punch_up",
      model: "gpt-5.4-mini",
      generate: async ({ persona }) => {
        if (persona.id === "persona-mark") {
          throw new Error("rate limit exceeded");
        }

        return `Response from ${persona.name}`;
      }
    });

    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]).toMatchObject({
      personaId: "persona-ruth",
      response: "Response from Ruth"
    });
    expect(result.errors).toEqual([
      {
        personaId: "persona-mark",
        personaName: "Mark",
        message: "rate limit exceeded"
      }
    ]);
  });

  it("returns empty notes and errors when no personas are eligible", async () => {
    const project = createSeedProject();
    project.personas = [hiddenPersona, conflictPersona];

    const result = await runVisibleWriters({
      project,
      sceneId: "scene-opening",
      task: "punch_up",
      model: "gpt-5.4-mini",
      generate: async () => {
        throw new Error("should not be called");
      }
    });

    expect(result).toEqual({ notes: [], errors: [] });
  });

  it("throws a clear error when the scene is missing", async () => {
    const project = createSeedProject();
    project.personas = [ruth];

    await expect(
      runVisibleWriters({
        project,
        sceneId: "scene-missing",
        task: "punch_up",
        model: "gpt-5.4-mini",
        generate: async () => "unused"
      })
    ).rejects.toThrow("Scene not found: scene-missing");
  });
});
