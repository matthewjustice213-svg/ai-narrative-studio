import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { projectSchema, type AiNote, type GraphEdge, type Persona, type ProjectDocument } from "../src/lib/schema.js";
import { createSeedProject } from "../src/lib/seedProject.js";
import type { CharacterPatch, PersonaPatch, ProjectPatch, ProjectRepository, ScenePatch } from "./types.js";

function projectFilePath(projectDir: string) {
  return path.join(projectDir, "project.json");
}

function readDocument(projectDir: string): ProjectDocument | null {
  const filePath = projectFilePath(projectDir);
  if (!existsSync(filePath)) return null;
  return projectSchema.parse(JSON.parse(readFileSync(filePath, "utf-8")));
}

function writeDocument(projectDir: string, project: ProjectDocument) {
  const parsed = projectSchema.parse({
    ...project,
    updatedAt: new Date().toISOString()
  });
  writeFileSync(projectFilePath(projectDir), `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
}

export function openProjectRepository(projectDir: string): ProjectRepository {
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(path.join(projectDir, "writers-room"), { recursive: true });
  mkdirSync(path.join(projectDir, "assets", "avatars"), { recursive: true });
  mkdirSync(path.join(projectDir, "assets", "references"), { recursive: true });

  if (!readDocument(projectDir)) {
    const seed = createSeedProject();
    writeDocument(projectDir, {
      ...seed,
      settings: {
        ...seed.settings,
        projectPath: projectDir
      }
    });
  }

  function loadProject() {
    const project = readDocument(projectDir);
    if (!project) throw new Error("Project document is missing after repository initialization.");
    return project;
  }

  function mutate(mutator: (project: ProjectDocument) => ProjectDocument) {
    const project = loadProject();
    const next = mutator(project);
    writeDocument(projectDir, next);

    const saved = readDocument(projectDir);
    if (!saved) throw new Error("Project document is missing after repository mutation.");
    return saved;
  }

  return {
    loadProject,
    saveProject(project) {
      writeDocument(projectDir, project);
    },
    updateProject(patch: ProjectPatch) {
      return mutate((project) => ({
        ...project,
        ...patch,
        settings: patch.settings ? { ...project.settings, ...patch.settings } : project.settings
      }));
    },
    updateScene(sceneId: string, patch: ScenePatch) {
      return mutate((project) => {
        if (!project.scenes.some((scene) => scene.id === sceneId)) {
          throw new Error(`Scene not found: ${sceneId}`);
        }

        return {
          ...project,
          scenes: project.scenes.map((scene) => (scene.id === sceneId ? { ...scene, ...patch } : scene))
        };
      });
    },
    updateCharacter(characterId: string, patch: CharacterPatch) {
      return mutate((project) => {
        if (!project.characters.some((character) => character.id === characterId)) {
          throw new Error(`Character not found: ${characterId}`);
        }

        return {
          ...project,
          characters: project.characters.map((character) =>
            character.id === characterId ? { ...character, ...patch } : character
          )
        };
      });
    },
    replaceEdges(edges: GraphEdge[]) {
      return mutate((project) => ({ ...project, edges }));
    },
    upsertPersona(persona: Persona) {
      return mutate((project) => ({
        ...project,
        personas: [...project.personas.filter((item) => item.id !== persona.id), persona]
      }));
    },
    updatePersona(personaId: string, patch: PersonaPatch) {
      return mutate((project) => {
        if (!project.personas.some((persona) => persona.id === personaId)) {
          throw new Error(`Persona not found: ${personaId}`);
        }

        return {
          ...project,
          personas: project.personas.map((persona) => (persona.id === personaId ? { ...persona, ...patch } : persona))
        };
      });
    },
    addAiNote(note: AiNote) {
      return mutate((project) => ({
        ...project,
        aiNotes: [note, ...project.aiNotes]
      }));
    },
    addAiNotes(notes: AiNote[]) {
      return mutate((project) => ({
        ...project,
        aiNotes: [...notes, ...project.aiNotes]
      }));
    }
  };
}
