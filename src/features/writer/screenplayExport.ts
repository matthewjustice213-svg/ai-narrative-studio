import type { ProjectDocument, Scene } from "../../lib/schema.js";

function sceneMarkdown(scene: Scene) {
  const screenplayText = scene.screenplayText.trim() || "_No screenplay text yet._";

  return [
    `## ${scene.title}`,
    "",
    scene.summary.trim() ? scene.summary.trim() : "_No scene summary yet._",
    "",
    `Runtime estimate: ${scene.runtimeEstimate} min`,
    "",
    "```screenplay",
    screenplayText,
    "```"
  ].join("\n");
}

export function exportProjectMarkdown(project: ProjectDocument) {
  return [`# ${project.title}`, "", ...project.scenes.map(sceneMarkdown)].join("\n\n");
}
