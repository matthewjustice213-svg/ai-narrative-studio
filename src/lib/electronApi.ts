import type { AiNote, AiTask, Character, GraphEdge, Persona, ProjectDocument, Scene } from "./schema.js";

export type WritersRoomError = {
  personaId: string;
  personaName: string;
  message: string;
};

export type WritersRoomResponse = {
  project: ProjectDocument;
  notes: AiNote[];
  errors: WritersRoomError[];
};

export type PersonaUpdatePatch = Partial<
  Pick<Persona, "visible" | "avatarPath" | "name" | "role" | "specialty" | "tone">
>;

export type NarrativeStudioApi = {
  loadDefaultProject(): Promise<ProjectDocument>;
  createProjectWithDialog(): Promise<ProjectDocument | null>;
  openProjectWithDialog(): Promise<ProjectDocument | null>;
  saveProject(project: ProjectDocument): Promise<ProjectDocument>;
  updateScene(sceneId: string, patch: Partial<Omit<Scene, "id">>): Promise<ProjectDocument>;
  updateCharacter(characterId: string, patch: Partial<Omit<Character, "id">>): Promise<ProjectDocument>;
  selectCharacterAvatarWithDialog(characterId: string): Promise<ProjectDocument | null>;
  selectSceneStoryboardWithDialog(sceneId: string): Promise<ProjectDocument | null>;
  importReferenceWithDialog(): Promise<ProjectDocument | null>;
  replaceEdges(edges: GraphEdge[]): Promise<ProjectDocument>;
  importSoulWithDialog(): Promise<ProjectDocument | null>;
  selectPersonaAvatarWithDialog(personaId: string): Promise<ProjectDocument | null>;
  updatePersona(personaId: string, patch: PersonaUpdatePatch): Promise<ProjectDocument>;
  runWritersRoom(sceneId: string, task: AiTask): Promise<WritersRoomResponse>;
  setOpenAiKey(apiKey: string): Promise<void>;
  hasOpenAiKey(): Promise<boolean>;
};

declare global {
  interface Window {
    narrativeStudio: NarrativeStudioApi;
  }
}
