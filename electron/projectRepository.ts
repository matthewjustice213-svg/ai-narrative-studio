import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { projectSchema, type AiNote, type GraphEdge, type Persona, type ProjectDocument } from "../src/lib/schema.js";
import { createSeedProject } from "../src/lib/seedProject.js";
import type { CharacterPatch, PersonaPatch, ProjectPatch, ProjectRepository, ScenePatch } from "./types.js";

type Row = { key: string; value: string };

function databasePath(projectDir: string) {
  return path.join(projectDir, "project.sqlite");
}

function withDatabase<T>(projectDir: string, callback: (db: Database.Database) => T) {
  const db = new Database(databasePath(projectDir));

  try {
    return callback(db);
  } finally {
    db.close();
  }
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function readDocument(db: Database.Database): ProjectDocument | null {
  const row = db.prepare("SELECT key, value FROM kv WHERE key = ?").get("project") as Row | undefined;
  if (!row) return null;
  return projectSchema.parse(JSON.parse(row.value));
}

function writeDocument(db: Database.Database, project: ProjectDocument) {
  const parsed = projectSchema.parse({
    ...project,
    updatedAt: new Date().toISOString()
  });
  db.prepare(
    "INSERT INTO kv (key, value) VALUES (@key, @value) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run({
    key: "project",
    value: JSON.stringify(parsed)
  });
}

export function openProjectRepository(projectDir: string): ProjectRepository {
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(path.join(projectDir, "writers-room"), { recursive: true });
  mkdirSync(path.join(projectDir, "assets", "avatars"), { recursive: true });
  mkdirSync(path.join(projectDir, "assets", "references"), { recursive: true });

  withDatabase(projectDir, (db) => {
    ensureSchema(db);

    if (!readDocument(db)) {
      const seed = createSeedProject();
      writeDocument(db, {
        ...seed,
        settings: {
          ...seed.settings,
          projectPath: projectDir
        }
      });
    }
  });

  function loadProject() {
    return withDatabase(projectDir, (db) => {
      const project = readDocument(db);
      if (!project) throw new Error("Project document is missing after repository initialization.");
      return project;
    });
  }

  function mutate(mutator: (project: ProjectDocument) => ProjectDocument) {
    return withDatabase(projectDir, (db) => {
      const project = readDocument(db);
      if (!project) throw new Error("Project document is missing after repository initialization.");

      const next = mutator(project);
      writeDocument(db, next);

      const saved = readDocument(db);
      if (!saved) throw new Error("Project document is missing after repository mutation.");
      return saved;
    });
  }

  return {
    loadProject,
    saveProject(project) {
      withDatabase(projectDir, (db) => writeDocument(db, project));
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
