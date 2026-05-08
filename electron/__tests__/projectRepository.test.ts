import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createSeedProject } from "../../src/lib/seedProject.js";
import type { Persona } from "../../src/lib/schema.js";
import { openProjectRepository } from "../projectRepository.js";

let tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs = [];
});

function tempProjectDir() {
  const dir = mkdtempSync(path.join(tmpdir(), "ans-project-"));
  tempDirs.push(dir);
  return dir;
}

const testPersona: Persona = {
  id: "persona-ruth",
  name: "Ruth",
  role: "Dialogue Punch-Up Writer",
  specialty: "grounded awkward comedy",
  tone: "blunt, practical, dry",
  avatarPath: null,
  visible: true,
  sourceSoulPath: "C:/story/writers-room/ruth.soul.md",
  allowedTasks: ["punch_up"],
  bodyMarkdown: "## Taste"
};

describe("project repository", () => {
  it("saves and loads a project document", () => {
    const projectDir = tempProjectDir();
    const repo = openProjectRepository(projectDir);
    const seed = createSeedProject();

    repo.saveProject(seed);
    const loaded = repo.loadProject();

    expect(loaded.title).toBe("Untitled Story");
    expect(loaded.scenes).toHaveLength(3);
    expect(loaded.edges[0].source).toBe("scene-opening");
  });

  it("updates a scene without losing graph edges", () => {
    const projectDir = tempProjectDir();
    const repo = openProjectRepository(projectDir);
    const seed = createSeedProject();
    repo.saveProject(seed);

    repo.updateScene("scene-opening", { title: "Cold Open" });
    const loaded = repo.loadProject();

    expect(loaded.scenes.find((scene) => scene.id === "scene-opening")?.title).toBe("Cold Open");
    expect(loaded.edges).toHaveLength(2);
  });

  it("throws when updating a missing scene", () => {
    const projectDir = tempProjectDir();
    const repo = openProjectRepository(projectDir);

    expect(() => repo.updateScene("missing-scene", { title: "Nope" })).toThrow(
      "Scene not found: missing-scene"
    );
  });

  it("throws when updating a missing character", () => {
    const projectDir = tempProjectDir();
    const repo = openProjectRepository(projectDir);

    expect(() => repo.updateCharacter("missing-character", { name: "Nope" })).toThrow(
      "Character not found: missing-character"
    );
  });

  it("throws when updating a missing persona", () => {
    const projectDir = tempProjectDir();
    const repo = openProjectRepository(projectDir);

    expect(() => repo.updatePersona("missing-persona", { name: "Nope" })).toThrow(
      "Persona not found: missing-persona"
    );
  });

  it("adds multiple AI notes in their original order before existing notes", () => {
    const projectDir = tempProjectDir();
    const repo = openProjectRepository(projectDir);
    const seed = {
      ...createSeedProject(),
      personas: [testPersona]
    };
    const existingNote = {
      id: "note-existing",
      sceneId: "scene-opening",
      personaId: seed.personas[0].id,
      task: "punch_up" as const,
      prompt: "Existing prompt",
      response: "Existing response",
      model: "gpt-5.4-mini",
      createdAt: "2026-05-08T00:00:00.000Z"
    };
    const firstNote = {
      ...existingNote,
      id: "note-first",
      personaId: seed.personas[0].id
    };
    const secondNote = {
      ...existingNote,
      id: "note-second",
      personaId: seed.personas[0].id
    };

    repo.saveProject({
      ...seed,
      aiNotes: [existingNote]
    });

    const updated = repo.addAiNotes([firstNote, secondNote]);

    expect(updated.aiNotes.map((note) => note.id)).toEqual(["note-first", "note-second", "note-existing"]);
  });
});
