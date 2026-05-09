import { create } from "zustand";
import type { AiTask, Character, GraphEdge, ProjectDocument, Scene } from "../lib/schema.js";
import { createSeedProject } from "../lib/seedProject.js";
import type { WritersRoomError } from "../lib/electronApi.js";

type Selection = { type: "scene"; id: string } | { type: "character"; id: string } | null;

type ProjectState = {
  project: ProjectDocument;
  selection: Selection;
  loadingAi: boolean;
  error: string | null;
  aiErrors: WritersRoomError[];
  setProject(project: ProjectDocument): void;
  selectScene(id: string): void;
  selectCharacter(id: string): void;
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

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createSeedProject(),
  selection: { type: "scene", id: "scene-opening" },
  loadingAi: false,
  error: null,
  aiErrors: [],
  setProject: (project) => set({ project, error: null }),
  selectScene: (id) => set({ selection: { type: "scene", id } }),
  selectCharacter: (id) => set({ selection: { type: "character", id } }),
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
