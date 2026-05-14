import { create } from "zustand";
import type {
  AiTask,
  Character,
  GraphEdge,
  GroupBox,
  ProjectDocument,
  Scene,
  StoryBeat,
  StoryBeatColumnId
} from "../lib/schema.js";
import { createSeedProject } from "../lib/seedProject.js";
import type { WritersRoomError } from "../lib/electronApi.js";
import {
  clampStudioLayout,
  defaultStudioLayout,
  readStoredStudioLayout,
  writeStoredStudioLayout,
  type StudioLayout
} from "./studioLayout.js";
import type { StudioModuleId } from "./studioModules.js";
import {
  addStoryBeat as addStoryBeatMutation,
  createGroupBoxAroundNodes,
  deleteGraphNode,
  deleteGroupBox,
  deleteStoryBeat as deleteStoryBeatMutation,
  moveStoryBeat as moveStoryBeatMutation,
  reorderStoryBeat as reorderStoryBeatMutation,
  setGraphNodeColor,
  updateStoryBeat as updateStoryBeatMutation,
  updateGroupBox,
  upsertGroupBox
} from "./projectMutations.js";

type Selection =
  | { type: "scene"; id: string }
  | { type: "character"; id: string }
  | { type: "groupBox"; id: string }
  | null;

type ProjectState = {
  project: ProjectDocument;
  activeModuleId: StudioModuleId;
  storyView: "canvas" | "beats";
  layout: StudioLayout;
  selection: Selection;
  loadingAi: boolean;
  error: string | null;
  aiErrors: WritersRoomError[];
  setProject(project: ProjectDocument): void;
  setActiveModule(moduleId: StudioModuleId): void;
  setStoryView(storyView: "canvas" | "beats"): void;
  updateLayout(patch: Partial<StudioLayout>): void;
  resetLayout(): void;
  loadDefaultProject(): Promise<void>;
  createProjectWithDialog(): Promise<void>;
  openProjectWithDialog(): Promise<void>;
  importSoulWithDialog(): Promise<void>;
  saveOpenAiKey(apiKey: string): Promise<void>;
  createScene(): Promise<void>;
  createCharacter(): Promise<void>;
  createGroupBox(position?: { x: number; y: number }): Promise<void>;
  createGroupBoxAround(nodeType: "scene" | "character"): Promise<void>;
  createStoryBeat(columnId?: StoryBeatColumnId): Promise<void>;
  updateStoryBeat(storyBeatId: string, patch: Partial<Omit<StoryBeat, "id" | "order">>): Promise<void>;
  moveStoryBeat(storyBeatId: string, columnId: StoryBeatColumnId): Promise<void>;
  reorderStoryBeat(storyBeatId: string, direction: "up" | "down"): Promise<void>;
  deleteStoryBeat(storyBeatId: string): Promise<void>;
  deleteNode(type: "scene" | "character", id: string): Promise<void>;
  deleteGroupBox(id: string): Promise<void>;
  setNodeColor(type: "scene" | "character", id: string, color: string | null): Promise<void>;
  updateGroupBox(id: string, patch: Partial<Omit<GroupBox, "id">>): Promise<void>;
  selectPersonaAvatarWithDialog(personaId: string): Promise<void>;
  selectCharacterAvatarWithDialog(characterId: string): Promise<void>;
  selectScene(id: string): void;
  selectCharacter(id: string): void;
  selectGroupBox(id: string): void;
  clearSelection(): void;
  updateScene(sceneId: string, patch: Partial<Omit<Scene, "id">>): Promise<void>;
  updateCharacter(characterId: string, patch: Partial<Omit<Character, "id">>): Promise<void>;
  replaceEdges(edges: GraphEdge[]): Promise<void>;
  togglePersona(personaId: string): Promise<void>;
  runWritersRoom(task: AiTask): Promise<void>;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function firstSceneSelection(project: ProjectDocument): Selection {
  return project.scenes[0] ? { type: "scene", id: project.scenes[0].id } : null;
}

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createSeedProject(),
  activeModuleId: "story",
  storyView: "canvas",
  layout: readStoredStudioLayout(),
  selection: { type: "scene", id: "scene-opening" },
  loadingAi: false,
  error: null,
  aiErrors: [],
  setProject: (project) => set({ project, error: null }),
  setActiveModule: (activeModuleId) => set({ activeModuleId }),
  setStoryView: (storyView) => set({ storyView, activeModuleId: "story" }),
  updateLayout: (patch) => {
    const layout = clampStudioLayout(get().layout, patch);
    writeStoredStudioLayout(layout);
    set({ layout });
  },
  resetLayout: () => {
    writeStoredStudioLayout(defaultStudioLayout);
    set({ layout: defaultStudioLayout });
  },
  loadDefaultProject: async () => {
    try {
      const project = await window.narrativeStudio.loadDefaultProject();
      set({ project, selection: firstSceneSelection(project), error: null, aiErrors: [] });
    } catch (error) {
      set({ error: errorMessage(error, "Default project load failed.") });
    }
  },
  createProjectWithDialog: async () => {
    try {
      const project = await window.narrativeStudio.createProjectWithDialog();
      if (project) {
        set({ project, selection: firstSceneSelection(project), error: null, aiErrors: [] });
      }
    } catch (error) {
      set({ error: errorMessage(error, "Project creation failed.") });
    }
  },
  openProjectWithDialog: async () => {
    try {
      const project = await window.narrativeStudio.openProjectWithDialog();
      if (project) {
        set({ project, selection: firstSceneSelection(project), error: null, aiErrors: [] });
      }
    } catch (error) {
      set({ error: errorMessage(error, "Project open failed.") });
    }
  },
  importSoulWithDialog: async () => {
    try {
      const project = await window.narrativeStudio.importSoulWithDialog();
      if (project) {
        set({ project, error: null });
      }
    } catch (error) {
      set({ error: errorMessage(error, "Persona import failed.") });
    }
  },
  saveOpenAiKey: async (apiKey) => {
    if (!apiKey.trim()) {
      set({ error: "Enter an OpenAI API key before saving." });
      return;
    }

    try {
      await window.narrativeStudio.setOpenAiKey(apiKey.trim());
      set({ error: null });
    } catch (error) {
      set({ error: errorMessage(error, "OpenAI API key save failed.") });
    }
  },
  createScene: async () => {
    const project = get().project;
    const lastScene = project.scenes.at(-1);
    const sceneId = createId("scene");
    const nextScene: Scene = {
      id: sceneId,
      title: "New Scene",
      summary: "",
      screenplayText: "",
      beatNotes: "",
      directorNotes: "",
      cameraNotes: "",
      shotList: "",
      lightingNotes: "",
      soundNotes: "",
      emotionalTone: "undecided",
      runtimeEstimate: 1,
      tags: [],
      linkedCharacterIds: [],
      color: null,
      position: {
        x: (lastScene?.position.x ?? 80) + 280,
        y: lastScene?.position.y ?? 90
      }
    };

    try {
      const saved = await window.narrativeStudio.saveProject({
        ...project,
        scenes: [...project.scenes, nextScene]
      });
      set({ project: saved, selection: { type: "scene", id: sceneId }, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Create or open a project before adding scenes.") });
    }
  },
  createCharacter: async () => {
    const project = get().project;
    const lastCharacter = project.characters.at(-1);
    const characterId = createId("char");
    const nextCharacter: Character = {
      id: characterId,
      name: "New Character",
      role: "Role",
      bio: "",
      motivation: "",
      fear: "",
      dialogueStyle: "",
      avatarPath: null,
      linkedSceneIds: [],
      color: null,
      position: {
        x: (lastCharacter?.position.x ?? 420) + 260,
        y: lastCharacter?.position.y ?? 520
      }
    };

    try {
      const saved = await window.narrativeStudio.saveProject({
        ...project,
        characters: [...project.characters, nextCharacter]
      });
      set({ project: saved, selection: { type: "character", id: characterId }, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Create or open a project before adding characters.") });
    }
  },
  createGroupBox: async (position) => {
    const project = get().project;
    const groupBoxId = createId("group");
    const nextProject = upsertGroupBox(project, {
      id: groupBoxId,
      title: "Group Box",
      color: "#38d8ff",
      position: position ?? { x: 120, y: 120 },
      width: 520,
      height: 320
    });

    try {
      const saved = await window.narrativeStudio.saveProject(nextProject);
      set({ project: saved, selection: { type: "groupBox", id: groupBoxId }, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Group box creation failed.") });
    }
  },
  createGroupBoxAround: async (nodeType) => {
    const project = get().project;
    const groupBoxId = `group-${nodeType}s`;
    const nextProject = createGroupBoxAroundNodes(project, {
      id: groupBoxId,
      nodeType,
      title: nodeType === "scene" ? "Story" : "Characters",
      color: nodeType === "scene" ? "#38d8ff" : "#ff4fd8"
    });

    try {
      const saved = await window.narrativeStudio.saveProject(nextProject);
      set({ project: saved, selection: { type: "groupBox", id: groupBoxId }, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Group box creation failed.") });
    }
  },
  createStoryBeat: async (columnId = "unassigned") => {
    const project = get().project;

    try {
      const saved = await window.narrativeStudio.saveProject(
        addStoryBeatMutation(project, {
          id: createId("beat"),
          columnId
        })
      );
      set({ project: saved, activeModuleId: "story", storyView: "beats", error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Story beat creation failed.") });
    }
  },
  updateStoryBeat: async (storyBeatId, patch) => {
    const project = get().project;

    try {
      const saved = await window.narrativeStudio.saveProject(
        updateStoryBeatMutation(project, {
          id: storyBeatId,
          ...patch
        })
      );
      set({ project: saved, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Story beat update failed.") });
    }
  },
  moveStoryBeat: async (storyBeatId, columnId) => {
    const project = get().project;

    try {
      const saved = await window.narrativeStudio.saveProject(
        moveStoryBeatMutation(project, {
          id: storyBeatId,
          columnId
        })
      );
      set({ project: saved, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Story beat move failed.") });
    }
  },
  reorderStoryBeat: async (storyBeatId, direction) => {
    const project = get().project;

    try {
      const saved = await window.narrativeStudio.saveProject(
        reorderStoryBeatMutation(project, {
          id: storyBeatId,
          direction
        })
      );
      set({ project: saved, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Story beat reorder failed.") });
    }
  },
  deleteStoryBeat: async (storyBeatId) => {
    const project = get().project;

    try {
      const saved = await window.narrativeStudio.saveProject(deleteStoryBeatMutation(project, storyBeatId));
      set({ project: saved, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Story beat deletion failed.") });
    }
  },
  deleteNode: async (type, id) => {
    const project = get().project;

    try {
      const saved = await window.narrativeStudio.saveProject(deleteGraphNode(project, { type, id }));
      set({ project: saved, selection: firstSceneSelection(saved), error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Node deletion failed.") });
    }
  },
  deleteGroupBox: async (id) => {
    const project = get().project;

    try {
      const saved = await window.narrativeStudio.saveProject(deleteGroupBox(project, id));
      set({ project: saved, selection: firstSceneSelection(saved), error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Group box deletion failed.") });
    }
  },
  setNodeColor: async (type, id, color) => {
    const project = get().project;

    try {
      const saved = await window.narrativeStudio.saveProject(setGraphNodeColor(project, { type, id, color }));
      set({ project: saved, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Node color update failed.") });
    }
  },
  updateGroupBox: async (id, patch) => {
    const project = get().project;

    try {
      const saved = await window.narrativeStudio.saveProject(updateGroupBox(project, { id, ...patch }));
      set({ project: saved, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Group box update failed.") });
    }
  },
  selectPersonaAvatarWithDialog: async (personaId) => {
    try {
      const project = await window.narrativeStudio.selectPersonaAvatarWithDialog(personaId);
      if (project) {
        set({ project, error: null });
      }
    } catch (error) {
      set({ error: errorMessage(error, "Persona avatar update failed.") });
    }
  },
  selectCharacterAvatarWithDialog: async (characterId) => {
    try {
      const project = await window.narrativeStudio.selectCharacterAvatarWithDialog(characterId);
      if (project) {
        set({ project, error: null });
      }
    } catch (error) {
      set({ error: errorMessage(error, "Character avatar update failed.") });
    }
  },
  selectScene: (id) => set({ selection: { type: "scene", id } }),
  selectCharacter: (id) => set({ selection: { type: "character", id } }),
  selectGroupBox: (id) => set({ selection: { type: "groupBox", id } }),
  clearSelection: () => set({ selection: null }),
  updateScene: async (sceneId, patch) => {
    try {
      const project = await window.narrativeStudio.updateScene(sceneId, patch);
      set({ project, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Scene update failed.") });
    }
  },
  updateCharacter: async (characterId, patch) => {
    try {
      const project = await window.narrativeStudio.updateCharacter(characterId, patch);
      set({ project, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Character update failed.") });
    }
  },
  replaceEdges: async (edges) => {
    try {
      const project = await window.narrativeStudio.replaceEdges(edges);
      set({ project, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Connection update failed.") });
    }
  },
  togglePersona: async (personaId) => {
    const persona = get().project.personas.find((item) => item.id === personaId);
    if (!persona) return;

    try {
      const project = await window.narrativeStudio.updatePersona(personaId, { visible: !persona.visible });
      set({ project, error: null });
    } catch (error) {
      set({ error: errorMessage(error, "Writer visibility update failed.") });
    }
  },
  runWritersRoom: async (task) => {
    const selection = get().selection;
    if (!selection || selection.type !== "scene") {
      set({ error: "Select a scene before asking the Writers Room." });
      return;
    }

    set({ loadingAi: true, error: null, aiErrors: [] });

    try {
      const result = await window.narrativeStudio.runWritersRoom(selection.id, task);
      set({
        project: result.project,
        loadingAi: false,
        aiErrors: result.errors,
        error: result.errors.length > 0 ? "Some Writers Room personas could not respond." : null
      });
    } catch (error) {
      set({
        loadingAi: false,
        error: errorMessage(error, "Writers Room failed.")
      });
    }
  }
}));
