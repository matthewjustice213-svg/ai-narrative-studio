import { app, dialog, ipcMain } from "electron";
import keytar from "keytar";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  projectSchema,
  type AiTask,
  type Character,
  type GraphEdge,
  type ProjectDocument,
  type Scene
} from "../src/lib/schema.js";
import type { PersonaUpdatePatch, WritersRoomResponse } from "../src/lib/electronApi.js";
import { generateOpenAiText } from "./openaiClient.js";
import { parseSoulMarkdown } from "./personaParser.js";
import { openProjectRepository } from "./projectRepository.js";
import { runVisibleWriters } from "./writersRoom.js";

const keytarService = "AI Narrative Studio";
const openAiAccount = "openai-api-key";

let activeProjectDir: string | null = null;
let handlersRegistered = false;

const registeredChannels = [
  "project:load-default",
  "project:create-dialog",
  "project:open-dialog",
  "project:save",
  "scene:update",
  "scene:select-storyboard-dialog",
  "character:update",
  "character:select-avatar-dialog",
  "edges:replace",
  "persona:import-dialog",
  "persona:select-avatar-dialog",
  "persona:update",
  "writers-room:run",
  "settings:set-openai-key",
  "settings:has-openai-key"
] as const;

const scenePatchKeys = [
  "title",
  "summary",
  "screenplayText",
  "beatNotes",
  "directorNotes",
  "cameraNotes",
  "shotList",
  "lightingNotes",
  "soundNotes",
  "storyboardImagePath",
  "storyboardExpanded",
  "emotionalTone",
  "runtimeEstimate",
  "tags",
  "linkedCharacterIds",
  "position"
] as const;

const characterPatchKeys = [
  "name",
  "role",
  "bio",
  "motivation",
  "fear",
  "dialogueStyle",
  "avatarPath",
  "linkedSceneIds",
  "position"
] as const;

const personaPatchKeys = ["visible", "avatarPath", "name", "role", "specialty", "tone"] as const;

function repo() {
  if (!activeProjectDir) {
    activeProjectDir = defaultProjectDir();
  }

  return openProjectRepository(activeProjectDir);
}

function defaultProjectDir() {
  return path.join(app.getPath("userData"), "projects", "default");
}

function loadProjectFromDir(projectDir: string) {
  const repository = openProjectRepository(projectDir);
  return repository.loadProject();
}

function activateProjectDir(projectDir: string) {
  const project = loadProjectFromDir(projectDir);
  activeProjectDir = projectDir;
  return project;
}

function avatarMimeType(avatarPath: string) {
  const extension = path.extname(avatarPath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp"
  };

  return mimeTypes[extension] ?? "application/octet-stream";
}

function toRenderableAvatarUrl(avatarPath: string | null) {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("data:image/")) return avatarPath;
  if (avatarPath.startsWith("file://")) {
    const filePath = fileURLToPath(avatarPath);
    return `data:${avatarMimeType(filePath)};base64,${readFileSync(filePath).toString("base64")}`;
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(avatarPath)) return avatarPath;
  return `data:${avatarMimeType(avatarPath)};base64,${readFileSync(avatarPath).toString("base64")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickPatch<T extends object>(value: unknown, keys: readonly string[], errorMessage: string): Partial<T> {
  if (!isRecord(value)) {
    throw new Error(errorMessage);
  }

  const patch: Record<string, unknown> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      patch[key] = value[key];
    }
  }

  return patch as Partial<T>;
}

function sanitizeProjectForSave(incoming: ProjectDocument, current: ProjectDocument): ProjectDocument {
  const incomingPersonasById = new Map(incoming.personas.map((persona) => [persona.id, persona]));

  return {
    ...incoming,
    id: current.id,
    createdAt: current.createdAt,
    settings: {
      ...incoming.settings,
      projectPath: current.settings.projectPath
    },
    personas: current.personas.map((currentPersona) => {
      const incomingPersona = incomingPersonasById.get(currentPersona.id);
      if (!incomingPersona) return currentPersona;

      return {
        ...currentPersona,
        ...pickPatch<PersonaUpdatePatch>(
          incomingPersona,
          personaPatchKeys,
          "Invalid persona payload in project save."
        )
      };
    }),
    aiNotes: current.aiNotes
  };
}

async function selectProjectDirectory(properties: Array<"openDirectory" | "createDirectory">) {
  const result = await dialog.showOpenDialog({
    title: properties.includes("createDirectory") ? "Choose or create a project folder" : "Open AI Narrative Studio project folder",
    properties
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
}

async function getOpenAiKey() {
  try {
    return await keytar.getPassword(keytarService, openAiAccount);
  } catch {
    throw new Error("Unable to access secure credential storage.");
  }
}

async function saveOpenAiKey(apiKey: string) {
  try {
    await keytar.setPassword(keytarService, openAiAccount, apiKey);
  } catch {
    throw new Error("Unable to save OpenAI API key.");
  }
}

export function resetIpcHandlersForTests() {
  for (const channel of registeredChannels) {
    ipcMain.removeHandler(channel);
  }

  handlersRegistered = false;
  activeProjectDir = null;
}

export function registerIpcHandlers() {
  if (handlersRegistered) return;
  handlersRegistered = true;

  ipcMain.handle("project:load-default", (): ProjectDocument => activateProjectDir(defaultProjectDir()));

  ipcMain.handle("project:create-dialog", async (): Promise<ProjectDocument | null> => {
    const projectDir = await selectProjectDirectory(["openDirectory", "createDirectory"]);
    if (!projectDir) return null;

    return activateProjectDir(projectDir);
  });

  ipcMain.handle("project:open-dialog", async (): Promise<ProjectDocument | null> => {
    const projectDir = await selectProjectDirectory(["openDirectory"]);
    if (!projectDir) return null;

    return activateProjectDir(projectDir);
  });

  ipcMain.handle("project:save", (_event, projectPayload: unknown): ProjectDocument => {
    const repository = repo();
    const current = repository.loadProject();
    const project = projectSchema.parse(projectPayload);
    repository.saveProject(sanitizeProjectForSave(project, current));
    return repository.loadProject();
  });

  ipcMain.handle(
    "scene:update",
    (_event, sceneId: string, patch: unknown): ProjectDocument =>
      repo().updateScene(
        sceneId,
        pickPatch<Omit<Scene, "id">>(patch, scenePatchKeys, "Invalid scene patch.")
      )
  );

  ipcMain.handle(
    "character:update",
    (_event, characterId: string, patch: unknown): ProjectDocument =>
      repo().updateCharacter(
        characterId,
        pickPatch<Omit<Character, "id">>(patch, characterPatchKeys, "Invalid character patch.")
      )
  );

  ipcMain.handle(
    "scene:select-storyboard-dialog",
    async (_event, sceneId: string): Promise<ProjectDocument | null> => {
      const repository = repo();
      const result = await dialog.showOpenDialog({
        title: "Choose scene storyboard image",
        properties: ["openFile"],
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"]
          }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) return null;

      return repository.updateScene(sceneId, {
        storyboardImagePath: toRenderableAvatarUrl(result.filePaths[0]),
        storyboardExpanded: true
      });
    }
  );

  ipcMain.handle(
    "character:select-avatar-dialog",
    async (_event, characterId: string): Promise<ProjectDocument | null> => {
      const repository = repo();
      const result = await dialog.showOpenDialog({
        title: "Choose character avatar",
        properties: ["openFile"],
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"]
          }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) return null;

      return repository.updateCharacter(characterId, { avatarPath: toRenderableAvatarUrl(result.filePaths[0]) });
    }
  );

  ipcMain.handle("edges:replace", (_event, edges: GraphEdge[]): ProjectDocument => repo().replaceEdges(edges));

  ipcMain.handle("persona:import-dialog", async (): Promise<ProjectDocument | null> => {
    const repository = repo();
    const result = await dialog.showOpenDialog({
      title: "Import structured soul.md persona",
      properties: ["openFile"],
      filters: [{ name: "Soul Markdown", extensions: ["md"] }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;

    const soulPath = result.filePaths[0];
    const markdown = readFileSync(soulPath, "utf-8");
    const persona = parseSoulMarkdown(markdown, soulPath);
    return repository.upsertPersona({
      ...persona,
      avatarPath: toRenderableAvatarUrl(persona.avatarPath)
    });
  });

  ipcMain.handle(
    "persona:select-avatar-dialog",
    async (_event, personaId: string): Promise<ProjectDocument | null> => {
      const repository = repo();
      const result = await dialog.showOpenDialog({
        title: "Choose persona avatar",
        properties: ["openFile"],
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"]
          }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) return null;

      return repository.updatePersona(personaId, { avatarPath: toRenderableAvatarUrl(result.filePaths[0]) });
    }
  );

  ipcMain.handle(
    "persona:update",
    (_event, personaId: string, patch: unknown): ProjectDocument =>
      repo().updatePersona(personaId, pickPatch<PersonaUpdatePatch>(patch, personaPatchKeys, "Invalid persona patch."))
  );

  ipcMain.handle(
    "writers-room:run",
    async (_event, sceneId: string, task: AiTask): Promise<WritersRoomResponse> => {
      const repository = repo();
      const project = repository.loadProject();
      const apiKey = await getOpenAiKey();

      if (!apiKey) {
        throw new Error("OpenAI API key is missing.");
      }

      const model = project.settings.model || "gpt-5.4-mini";
      const { notes, errors } = await runVisibleWriters({
        project,
        sceneId,
        task,
        model,
        generate: ({ prompt }) => generateOpenAiText({ apiKey, model, prompt })
      });

      const updatedProject = notes.length > 0 ? repository.addAiNotes(notes) : repository.loadProject();

      return {
        project: updatedProject,
        notes,
        errors
      };
    }
  );

  ipcMain.handle("settings:set-openai-key", async (_event, apiKey: string): Promise<void> => {
    await saveOpenAiKey(apiKey);
  });

  ipcMain.handle("settings:has-openai-key", async (): Promise<boolean> => {
    const apiKey = await getOpenAiKey();
    return Boolean(apiKey);
  });
}
