import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSeedProject } from "../../src/lib/seedProject.js";
import type { AiNote, ProjectDocument } from "../../src/lib/schema.js";

type Handler = (...args: unknown[]) => unknown;

const handlers = new Map<string, Handler>();
const showOpenDialog = vi.fn();
const getPassword = vi.fn();
const setPassword = vi.fn();
const loadProject = vi.fn();
const saveProject = vi.fn();
const upsertPersona = vi.fn();
const updatePersona = vi.fn();
const updateScene = vi.fn();
const addAiNotes = vi.fn();
const runVisibleWriters = vi.fn();
const generateOpenAiText = vi.fn();
let tempDirs: string[] = [];

vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Handler) => {
      handlers.set(channel, handler);
    }),
    removeHandler: vi.fn((channel: string) => {
      handlers.delete(channel);
    })
  },
  dialog: {
    showOpenDialog
  }
}));

vi.mock("keytar", () => ({
  default: {
    getPassword,
    setPassword
  }
}));

vi.mock("../projectRepository.js", () => ({
  openProjectRepository: vi.fn(() => ({
    loadProject,
    saveProject,
    updateScene,
    updateCharacter: vi.fn(),
    replaceEdges: vi.fn(),
    upsertPersona,
    updatePersona,
    addAiNotes
  }))
}));

vi.mock("../personaParser.js", () => ({
  parseSoulMarkdown: vi.fn(() => ({
    id: "persona-imported",
    name: "Imported",
    role: "Reader",
    specialty: "notes",
    tone: "direct",
    avatarPath: null,
    visible: true,
    sourceSoulPath: "C:/story/persona.md",
    allowedTasks: ["punch_up"],
    bodyMarkdown: "Body"
  }))
}));

vi.mock("../writersRoom.js", () => ({
  runVisibleWriters
}));

vi.mock("../openaiClient.js", () => ({
  generateOpenAiText
}));

function invoke(channel: string, ...args: unknown[]) {
  const handler = handlers.get(channel);
  if (!handler) throw new Error(`Missing handler: ${channel}`);
  return handler({}, ...args);
}

function note(id: string): AiNote {
  return {
    id,
    sceneId: "scene-opening",
    personaId: `persona-${id}`,
    task: "punch_up",
    prompt: "Prompt",
    response: "Response",
    model: "gpt-5.4-mini",
    createdAt: "2026-05-08T00:00:00.000Z"
  };
}

function tempSoulFile() {
  const dir = mkdtempSync(path.join(tmpdir(), "ans-soul-"));
  tempDirs.push(dir);
  const file = path.join(dir, "persona.md");
  writeFileSync(file, "# Imported", "utf-8");
  return file;
}

describe("ipc handlers", () => {
  afterEach(() => {
    for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
    tempDirs = [];
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    handlers.clear();
    loadProject.mockReturnValue(createSeedProject());
    saveProject.mockReturnValue(undefined);
    upsertPersona.mockReturnValue(createSeedProject());
    updatePersona.mockReturnValue(createSeedProject());
    updateScene.mockReturnValue(createSeedProject());
    addAiNotes.mockImplementation((notes: AiNote[]) => ({
      ...createSeedProject(),
      aiNotes: notes
    }));
    runVisibleWriters.mockResolvedValue({ notes: [], errors: [] });

    const { resetIpcHandlersForTests, registerIpcHandlers } = await import("../ipc.js");
    resetIpcHandlersForTests();
    registerIpcHandlers();
  });

  it("registers dialog-backed project channels only once", async () => {
    const { ipcMain } = await import("electron");
    const { registerIpcHandlers } = await import("../ipc.js");

    registerIpcHandlers();

    expect(ipcMain.handle).toHaveBeenCalledTimes(11);
    expect(handlers.has("project:create-dialog")).toBe(true);
    expect(handlers.has("project:open-dialog")).toBe(true);
    expect(handlers.has("persona:import-dialog")).toBe(true);
    expect(handlers.has("project:create")).toBe(false);
    expect(handlers.has("project:open")).toBe(false);
    expect(handlers.has("persona:import")).toBe(false);
  });

  it("returns null when create project dialog is canceled", async () => {
    showOpenDialog.mockResolvedValueOnce({ canceled: true, filePaths: [] });

    await expect(invoke("project:create-dialog")).resolves.toBeNull();
    expect(showOpenDialog).toHaveBeenCalledWith({ properties: ["openDirectory", "createDirectory"] });
    expect(loadProject).not.toHaveBeenCalled();
  });

  it("does not switch active project when a dialog-selected project fails to load", async () => {
    const existingProject = { ...createSeedProject(), title: "Existing" };
    const importedProject = { ...createSeedProject(), title: "Imported" };
    const soulFile = tempSoulFile();
    showOpenDialog
      .mockResolvedValueOnce({ canceled: false, filePaths: ["C:/projects/existing"] })
      .mockResolvedValueOnce({ canceled: false, filePaths: ["C:/projects/broken"] })
      .mockResolvedValueOnce({ canceled: false, filePaths: [soulFile] });
    loadProject.mockReturnValueOnce(existingProject).mockImplementationOnce(() => {
      throw new Error("Cannot load project");
    });
    upsertPersona.mockReturnValueOnce(importedProject);

    await expect(invoke("project:open-dialog")).resolves.toBe(existingProject);
    await expect(invoke("project:open-dialog")).rejects.toThrow("Cannot load project");
    await expect(invoke("persona:import-dialog")).resolves.toBe(importedProject);

    const { openProjectRepository } = await import("../projectRepository.js");
    expect(openProjectRepository).toHaveBeenLastCalledWith("C:/projects/existing");
  });

  it("requires an active project before importing a soul file", async () => {
    await expect(invoke("persona:import-dialog")).rejects.toThrow("No project is open.");
    expect(showOpenDialog).not.toHaveBeenCalled();
    expect(upsertPersona).not.toHaveBeenCalled();
  });

  it("strips protected fields from persona update payloads", async () => {
    showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ["C:/projects/existing"] });
    await invoke("project:open-dialog");

    await invoke("persona:update", "persona-ruth", {
      id: "persona-hijack",
      name: "Ruth Updated",
      sourceSoulPath: "C:/stolen/soul.md",
      bodyMarkdown: "Overwritten",
      visible: false
    });

    expect(updatePersona).toHaveBeenCalledWith("persona-ruth", {
      name: "Ruth Updated",
      visible: false
    });
  });

  it("strips ids from scene update payloads", async () => {
    showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ["C:/projects/existing"] });
    await invoke("project:open-dialog");

    await invoke("scene:update", "scene-opening", {
      id: "scene-hijack",
      title: "Safer Title"
    });

    expect(updateScene).toHaveBeenCalledWith("scene-opening", {
      title: "Safer Title"
    });
  });

  it("preserves main-owned project fields during full project saves", async () => {
    const originalNote = note("original");
    const currentProject: ProjectDocument = {
      ...createSeedProject(),
      settings: {
        ...createSeedProject().settings,
        projectPath: "C:/projects/existing"
      },
      personas: [
        {
          id: "persona-ruth",
          name: "Ruth",
          role: "Reader",
          specialty: "dialogue",
          tone: "direct",
          avatarPath: null,
          visible: true,
          sourceSoulPath: "C:/projects/existing/writers-room/ruth.soul.md",
          allowedTasks: ["punch_up"],
          bodyMarkdown: "Original body"
        }
      ],
      aiNotes: [originalNote]
    };
    const rendererProject: ProjectDocument = {
      ...currentProject,
      settings: {
        ...currentProject.settings,
        projectPath: "C:/attacker"
      },
      personas: [
        {
          ...currentProject.personas[0],
          name: "Ruth Renamed",
          sourceSoulPath: "C:/attacker/ruth.soul.md",
          bodyMarkdown: "Tampered body"
        }
      ],
      aiNotes: []
    };

    showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ["C:/projects/existing"] });
    loadProject.mockReturnValue(currentProject);

    await invoke("project:open-dialog");
    await invoke("project:save", rendererProject);

    const savedProject = saveProject.mock.calls[0][0] as ProjectDocument;
    expect(savedProject.settings.projectPath).toBe("C:/projects/existing");
    expect(savedProject.personas[0]).toMatchObject({
      id: "persona-ruth",
      name: "Ruth Renamed",
      sourceSoulPath: "C:/projects/existing/writers-room/ruth.soul.md",
      bodyMarkdown: "Original body"
    });
    expect(savedProject.aiNotes).toEqual([originalNote]);
  });

  it("saves generated notes as a batch in result order", async () => {
    const first = note("a");
    const second = note("b");
    const projectWithNotes: ProjectDocument = {
      ...createSeedProject(),
      aiNotes: [first, second]
    };
    showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ["C:/projects/existing"] });
    loadProject.mockReturnValue(createSeedProject());
    getPassword.mockResolvedValue("sk-test");
    runVisibleWriters.mockResolvedValue({ notes: [first, second], errors: [] });
    addAiNotes.mockReturnValue(projectWithNotes);

    await invoke("project:open-dialog");
    const result = await invoke("writers-room:run", "scene-opening", "punch_up");

    expect(addAiNotes).toHaveBeenCalledWith([first, second]);
    expect((result as { project: ProjectDocument }).project.aiNotes.map((savedNote) => savedNote.id)).toEqual(["a", "b"]);
  });

  it("preserves missing OpenAI key error while normalizing credential read failures", async () => {
    showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ["C:/projects/existing"] });
    await invoke("project:open-dialog");

    getPassword.mockResolvedValueOnce(null);
    await expect(invoke("writers-room:run", "scene-opening", "punch_up")).rejects.toThrow(
      "OpenAI API key is missing."
    );

    getPassword.mockRejectedValueOnce(new Error("native keychain failure"));
    await expect(invoke("writers-room:run", "scene-opening", "punch_up")).rejects.toThrow(
      "Unable to access secure credential storage."
    );
  });

  it("requires an active project before checking OpenAI credentials", async () => {
    await expect(invoke("writers-room:run", "scene-opening", "punch_up")).rejects.toThrow("No project is open.");
    expect(getPassword).not.toHaveBeenCalled();
  });

  it("normalizes credential save failures", async () => {
    setPassword.mockRejectedValueOnce(new Error("native keychain failure"));

    await expect(invoke("settings:set-openai-key", "sk-test")).rejects.toThrow(
      "Unable to save OpenAI API key."
    );
  });
});
