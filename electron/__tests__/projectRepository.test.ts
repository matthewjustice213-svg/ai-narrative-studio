import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createSeedProject } from "../../src/lib/seedProject.js";
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
});
