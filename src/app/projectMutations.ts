import type { GroupBox, ProjectDocument } from "../lib/schema.js";

type GraphNodeTarget = { type: "scene" | "character"; id: string };
type GroupBoxTarget = { id: string };

const sceneNodeSize = { width: 250, height: 142 };
const characterNodeSize = { width: 280, height: 132 };
const groupMargin = 64;

export function deleteGraphNode(project: ProjectDocument, target: GraphNodeTarget): ProjectDocument {
  if (target.type === "scene") {
    return {
      ...project,
      scenes: project.scenes.filter((scene) => scene.id !== target.id),
      characters: project.characters.map((character) => ({
        ...character,
        linkedSceneIds: character.linkedSceneIds.filter((sceneId) => sceneId !== target.id)
      })),
      edges: project.edges.filter((edge) => edge.source !== target.id && edge.target !== target.id),
      aiNotes: project.aiNotes.filter((note) => note.sceneId !== target.id)
    };
  }

  return {
    ...project,
    characters: project.characters.filter((character) => character.id !== target.id),
    scenes: project.scenes.map((scene) => ({
      ...scene,
      linkedCharacterIds: scene.linkedCharacterIds.filter((characterId) => characterId !== target.id)
    })),
    edges: project.edges.filter((edge) => edge.source !== target.id && edge.target !== target.id)
  };
}

export function setGraphNodeColor(
  project: ProjectDocument,
  target: GraphNodeTarget & { color: string | null }
): ProjectDocument {
  if (target.type === "scene") {
    return {
      ...project,
      scenes: project.scenes.map((scene) => (scene.id === target.id ? { ...scene, color: target.color } : scene))
    };
  }

  return {
    ...project,
    characters: project.characters.map((character) =>
      character.id === target.id ? { ...character, color: target.color } : character
    )
  };
}

export function upsertGroupBox(project: ProjectDocument, groupBox: GroupBox): ProjectDocument {
  return {
    ...project,
    groupBoxes: [...project.groupBoxes.filter((box) => box.id !== groupBox.id), groupBox]
  };
}

export function updateGroupBox(
  project: ProjectDocument,
  target: GroupBoxTarget & Partial<Omit<GroupBox, "id">>
): ProjectDocument {
  return {
    ...project,
    groupBoxes: project.groupBoxes.map((box) => (box.id === target.id ? { ...box, ...target } : box))
  };
}

export function deleteGroupBox(project: ProjectDocument, groupBoxId: string): ProjectDocument {
  return {
    ...project,
    groupBoxes: project.groupBoxes.filter((box) => box.id !== groupBoxId)
  };
}

export function createGroupBoxAroundNodes(
  project: ProjectDocument,
  options: {
    id: string;
    nodeType: "scene" | "character";
    title: string;
    color: string;
  }
): ProjectDocument {
  const sourceNodes =
    options.nodeType === "scene"
      ? project.scenes.map((scene) => ({ position: scene.position, ...sceneNodeSize }))
      : project.characters.map((character) => ({ position: character.position, ...characterNodeSize }));

  if (sourceNodes.length === 0) return project;

  const minX = Math.min(...sourceNodes.map((node) => node.position.x));
  const minY = Math.min(...sourceNodes.map((node) => node.position.y));
  const maxX = Math.max(...sourceNodes.map((node) => node.position.x + node.width));
  const maxY = Math.max(...sourceNodes.map((node) => node.position.y + node.height));

  return upsertGroupBox(project, {
    id: options.id,
    title: options.title,
    color: options.color,
    position: { x: minX - groupMargin, y: minY - groupMargin },
    width: maxX - minX + groupMargin * 2,
    height: maxY - minY + groupMargin * 2
  });
}
