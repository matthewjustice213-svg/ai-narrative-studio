import crypto from "node:crypto";
import type { AiNote, AiTask, Persona, ProjectDocument, Scene } from "../src/lib/schema.js";
import type { WritersRoomError } from "../src/lib/electronApi.js";

export type GeneratePersonaText = (input: {
  persona: Persona;
  prompt: string;
  model: string;
}) => Promise<string>;

export type WritersRoomRunResult = {
  notes: AiNote[];
  errors: WritersRoomError[];
};

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "None";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  return "Unknown error";
}

function formatLinkedCharacters(project: ProjectDocument, scene: Scene) {
  const linkedCharacters = project.characters.filter((character) =>
    scene.linkedCharacterIds.includes(character.id)
  );

  if (linkedCharacters.length === 0) {
    return "No linked characters.";
  }

  return linkedCharacters
    .map((character) =>
      [
        `Character: ${character.name}`,
        `Role: ${character.role || "Unspecified"}`,
        `Bio: ${character.bio || "Unspecified"}`,
        `Motivation: ${character.motivation || "Unspecified"}`,
        `Fear: ${character.fear || "Unspecified"}`,
        `Dialogue Style: ${character.dialogueStyle || "Unspecified"}`
      ].join("\n")
    )
    .join("\n\n");
}

export function buildPersonaPrompt(
  project: ProjectDocument,
  scene: Scene,
  persona: Persona,
  task: AiTask
) {
  return [
    "# AI Narrative Studio Writers Room",
    "",
    "## Persona",
    `Persona: ${persona.name}`,
    `Role: ${persona.role}`,
    `Specialty: ${persona.specialty}`,
    `Tone: ${persona.tone}`,
    "",
    "## Soul Context",
    persona.bodyMarkdown,
    "",
    "## Task",
    `Task: ${task}`,
    "",
    "## Project Context",
    `Project Title: ${project.title}`,
    `Selected Scene: ${scene.title}`,
    `Summary: ${scene.summary}`,
    `Emotional Tone: ${scene.emotionalTone}`,
    `Runtime Estimate: ${scene.runtimeEstimate} minutes`,
    `Tags: ${formatList(scene.tags)}`,
    "",
    "## Linked Characters",
    formatLinkedCharacters(project, scene),
    "",
    "## Beat Notes",
    scene.beatNotes || "No beat notes provided.",
    "",
    "## Screenplay Text",
    scene.screenplayText || "No screenplay text provided.",
    "",
    "## Response Format:",
    "Return concise, production-useful notes in markdown.",
    "Use specific bullets tied to the selected scene.",
    "Do not rewrite the whole scene unless the task explicitly asks for punch-up options."
  ].join("\n");
}

export async function runVisibleWriters(input: {
  project: ProjectDocument;
  sceneId: string;
  task: AiTask;
  model: string;
  generate: GeneratePersonaText;
}): Promise<WritersRoomRunResult> {
  const scene = input.project.scenes.find((candidate) => candidate.id === input.sceneId);

  if (!scene) {
    throw new Error(`Scene not found: ${input.sceneId}`);
  }

  const eligiblePersonas = input.project.personas.filter(
    (persona) => persona.visible === true && persona.allowedTasks.includes(input.task)
  );

  const results = await Promise.all(
    eligiblePersonas.map(async (persona) => {
      const prompt = buildPersonaPrompt(input.project, scene, persona, input.task);

      try {
        const response = await input.generate({ persona, prompt, model: input.model });

        return {
          note: {
            id: crypto.randomUUID(),
            sceneId: scene.id,
            personaId: persona.id,
            task: input.task,
            prompt,
            response,
            model: input.model,
            createdAt: new Date().toISOString()
          },
          error: null
        };
      } catch (error) {
        return {
          note: null,
          error: {
            personaId: persona.id,
            personaName: persona.name,
            message: getErrorMessage(error)
          }
        };
      }
    })
  );

  return {
    notes: results.flatMap((result) => (result.note ? [result.note] : [])),
    errors: results.flatMap((result) => (result.error ? [result.error] : []))
  };
}
