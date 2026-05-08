import type { AiNote, Character, GraphEdge, Persona, ProjectDocument, Scene } from "../src/lib/schema.js";

export type ProjectPatch = Partial<Pick<ProjectDocument, "title" | "settings">>;
export type ScenePatch = Partial<Omit<Scene, "id">>;
export type CharacterPatch = Partial<Omit<Character, "id">>;
export type PersonaPatch = Partial<Omit<Persona, "id" | "sourceSoulPath" | "bodyMarkdown">>;

export type ProjectRepository = {
  loadProject(): ProjectDocument;
  saveProject(project: ProjectDocument): void;
  updateProject(patch: ProjectPatch): ProjectDocument;
  updateScene(sceneId: string, patch: ScenePatch): ProjectDocument;
  updateCharacter(characterId: string, patch: CharacterPatch): ProjectDocument;
  replaceEdges(edges: GraphEdge[]): ProjectDocument;
  upsertPersona(persona: Persona): ProjectDocument;
  updatePersona(personaId: string, patch: PersonaPatch): ProjectDocument;
  addAiNote(note: AiNote): ProjectDocument;
};
