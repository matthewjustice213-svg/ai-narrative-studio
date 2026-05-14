import { z } from "zod";

const isoDatetimeSchema = z.iso.datetime();

export const edgeTypeSchema = z.enum([
  "progression",
  "flashback",
  "setup_payoff",
  "foreshadowing",
  "emotional_connection",
  "parallel_narrative",
  "character_relationship"
]);

export const aiTaskSchema = z.enum([
  "scene_notes",
  "dialogue_notes",
  "punch_up",
  "scene_conflict",
  "ask_writers_room"
]);

export const pointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const storyBeatColumnSchema = z.enum(["unassigned", "act_1", "act_2a", "midpoint", "act_2b", "act_3"]);

export const storyBeatSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  columnId: storyBeatColumnSchema,
  color: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  order: z.number().min(0)
});

export const groupBoxSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  color: z.string().min(1),
  position: pointSchema,
  width: z.number().min(160),
  height: z.number().min(120)
});

export const sceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  screenplayText: z.string(),
  beatNotes: z.string(),
  directorNotes: z.string().default(""),
  cameraNotes: z.string().default(""),
  shotList: z.string().default(""),
  lightingNotes: z.string().default(""),
  soundNotes: z.string().default(""),
  storyboardImagePath: z.string().nullable().default(null),
  storyboardExpanded: z.boolean().default(false),
  emotionalTone: z.string(),
  runtimeEstimate: z.number().min(0),
  tags: z.array(z.string()),
  linkedCharacterIds: z.array(z.string()),
  color: z.string().nullable().default(null),
  position: pointSchema
});

export const characterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string(),
  bio: z.string(),
  motivation: z.string(),
  fear: z.string(),
  dialogueStyle: z.string(),
  avatarPath: z.string().nullable(),
  linkedSceneIds: z.array(z.string()),
  color: z.string().nullable().default(null),
  position: pointSchema
});

export const graphEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: edgeTypeSchema,
  label: z.string(),
  color: z.string()
});

export const personaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  specialty: z.string().min(1),
  tone: z.string().min(1),
  avatarPath: z.string().nullable(),
  visible: z.boolean(),
  sourceSoulPath: z.string(),
  allowedTasks: z.array(aiTaskSchema),
  bodyMarkdown: z.string()
});

export const aiNoteSchema = z.object({
  id: z.string().min(1),
  sceneId: z.string().min(1),
  personaId: z.string().min(1),
  task: aiTaskSchema,
  prompt: z.string(),
  response: z.string(),
  model: z.string(),
  createdAt: isoDatetimeSchema
});

export const projectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
  settings: z.object({
    model: z.string().min(1),
    projectPath: z.string().nullable()
  }),
  storyBeats: z.array(storyBeatSchema).default([]),
  groupBoxes: z.array(groupBoxSchema).default([]),
  scenes: z.array(sceneSchema),
  characters: z.array(characterSchema),
  edges: z.array(graphEdgeSchema),
  personas: z.array(personaSchema),
  aiNotes: z.array(aiNoteSchema)
}).superRefine((project, ctx) => {
  const addIssue = (message: string, path: (string | number)[]) => {
    ctx.addIssue({
      code: "custom",
      message,
      path
    });
  };

  const addDuplicateIdIssues = (items: { id: string }[], collectionPath: string) => {
    const seenIds = new Map<string, number>();

    items.forEach((item, index) => {
      const firstIndex = seenIds.get(item.id);

      if (firstIndex === undefined) {
        seenIds.set(item.id, index);
        return;
      }

      addIssue(`Duplicate ${collectionPath} id: ${item.id}`, [collectionPath, index, "id"]);
      addIssue(`Duplicate ${collectionPath} id: ${item.id}`, [collectionPath, firstIndex, "id"]);
    });
  };

  addDuplicateIdIssues(project.scenes, "scenes");
  addDuplicateIdIssues(project.characters, "characters");
  addDuplicateIdIssues(project.storyBeats, "storyBeats");
  addDuplicateIdIssues(project.groupBoxes, "groupBoxes");
  addDuplicateIdIssues(project.edges, "edges");
  addDuplicateIdIssues(project.personas, "personas");
  addDuplicateIdIssues(project.aiNotes, "aiNotes");

  const sceneIds = new Set(project.scenes.map((scene) => scene.id));
  const characterIds = new Set(project.characters.map((character) => character.id));
  const graphNodeIds = new Set([...sceneIds, ...characterIds]);
  const personaIds = new Set(project.personas.map((persona) => persona.id));
  const characterIndexById = new Map(
    project.characters.map((character, index) => [character.id, index])
  );

  project.scenes.forEach((scene, index) => {
    const characterIndex = characterIndexById.get(scene.id);

    if (characterIndex !== undefined) {
      addIssue(`Scene id collides with character id: ${scene.id}`, ["scenes", index, "id"]);
      addIssue(`Character id collides with scene id: ${scene.id}`, [
        "characters",
        characterIndex,
        "id"
      ]);
    }
  });

  project.edges.forEach((edge, index) => {
    if (!graphNodeIds.has(edge.source)) {
      addIssue(`Edge source does not reference a scene or character: ${edge.source}`, [
        "edges",
        index,
        "source"
      ]);
    }

    if (!graphNodeIds.has(edge.target)) {
      addIssue(`Edge target does not reference a scene or character: ${edge.target}`, [
        "edges",
        index,
        "target"
      ]);
    }
  });

  project.scenes.forEach((scene, sceneIndex) => {
    scene.linkedCharacterIds.forEach((characterId, characterIndex) => {
      if (!characterIds.has(characterId)) {
        addIssue(`Scene linkedCharacterId does not reference a character: ${characterId}`, [
          "scenes",
          sceneIndex,
          "linkedCharacterIds",
          characterIndex
        ]);
      }
    });
  });

  project.characters.forEach((character, characterIndex) => {
    character.linkedSceneIds.forEach((sceneId, sceneIndex) => {
      if (!sceneIds.has(sceneId)) {
        addIssue(`Character linkedSceneId does not reference a scene: ${sceneId}`, [
          "characters",
          characterIndex,
          "linkedSceneIds",
          sceneIndex
        ]);
      }
    });
  });

  project.aiNotes.forEach((note, index) => {
    if (!sceneIds.has(note.sceneId)) {
      addIssue(`AI note sceneId does not reference a scene: ${note.sceneId}`, [
        "aiNotes",
        index,
        "sceneId"
      ]);
    }

    if (!personaIds.has(note.personaId)) {
      addIssue(`AI note personaId does not reference a persona: ${note.personaId}`, [
        "aiNotes",
        index,
        "personaId"
      ]);
    }
  });
});

export const soulFrontmatterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  specialty: z.string().min(1),
  tone: z.string().min(1),
  avatar: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  disabled: z.boolean().optional(),
  allowed_tasks: z.array(aiTaskSchema).min(1)
});

export type AiTask = z.infer<typeof aiTaskSchema>;
export type StoryBeatColumnId = z.infer<typeof storyBeatColumnSchema>;
export type StoryBeat = z.infer<typeof storyBeatSchema>;
export type GroupBox = z.infer<typeof groupBoxSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Character = z.infer<typeof characterSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type Persona = z.infer<typeof personaSchema>;
export type AiNote = z.infer<typeof aiNoteSchema>;
export type ProjectDocument = z.infer<typeof projectSchema>;
export type SoulFrontmatter = z.infer<typeof soulFrontmatterSchema>;
