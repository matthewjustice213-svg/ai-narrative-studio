import type { GroupBox, ProjectDocument, StoryBeat, StoryBeatColumnId } from "../lib/schema.js";

type GraphNodeTarget = { type: "scene" | "character"; id: string };
type GroupBoxTarget = { id: string };
type StoryBeatTarget = { id: string };

const sceneNodeSize = { width: 250, height: 142 };
const characterNodeSize = { width: 280, height: 132 };
const groupMargin = 64;

function normalizeStoryBeatOrders(storyBeats: StoryBeat[]) {
  const byColumn = new Map<StoryBeatColumnId, StoryBeat[]>();

  for (const beat of storyBeats) {
    byColumn.set(beat.columnId, [...(byColumn.get(beat.columnId) ?? []), beat]);
  }

  return storyBeats.map((beat) => {
    const orderedColumn = [...(byColumn.get(beat.columnId) ?? [])].sort((first, second) => first.order - second.order);
    const order = orderedColumn.findIndex((item) => item.id === beat.id);
    return { ...beat, order: Math.max(order, 0) };
  });
}

export function deleteGraphNode(project: ProjectDocument, target: GraphNodeTarget): ProjectDocument {
  if (target.type === "scene") {
    return {
      ...project,
      scenes: project.scenes.filter((scene) => scene.id !== target.id),
      characters: project.characters.map((character) => ({
        ...character,
        linkedSceneIds: character.linkedSceneIds.filter((sceneId) => sceneId !== target.id)
      })),
      references: project.references.map((reference) => ({
        ...reference,
        linkedSceneIds: reference.linkedSceneIds.filter((sceneId) => sceneId !== target.id)
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

export function addStoryBeat(
  project: ProjectDocument,
  options: { id: string; columnId: StoryBeatColumnId }
): ProjectDocument {
  const order = project.storyBeats.filter((beat) => beat.columnId === options.columnId).length;

  return {
    ...project,
    storyBeats: [
      ...project.storyBeats,
      {
        id: options.id,
        title: "New Beat",
        summary: "",
        columnId: options.columnId,
        color: null,
        tags: [],
        order
      }
    ]
  };
}

export function updateStoryBeat(
  project: ProjectDocument,
  target: StoryBeatTarget & Partial<Omit<StoryBeat, "id" | "order">>
): ProjectDocument {
  return {
    ...project,
    storyBeats: project.storyBeats.map((beat) => (beat.id === target.id ? { ...beat, ...target } : beat))
  };
}

export function moveStoryBeat(
  project: ProjectDocument,
  target: StoryBeatTarget & { columnId: StoryBeatColumnId }
): ProjectDocument {
  const targetColumnOrder = project.storyBeats.filter(
    (beat) => beat.columnId === target.columnId && beat.id !== target.id
  ).length;

  return {
    ...project,
    storyBeats: normalizeStoryBeatOrders(
      project.storyBeats.map((beat) =>
        beat.id === target.id ? { ...beat, columnId: target.columnId, order: targetColumnOrder } : beat
      )
    )
  };
}

export function reorderStoryBeat(
  project: ProjectDocument,
  target: StoryBeatTarget & { direction: "up" | "down" }
): ProjectDocument {
  const beat = project.storyBeats.find((item) => item.id === target.id);
  if (!beat) return project;

  const columnBeats = project.storyBeats
    .filter((item) => item.columnId === beat.columnId)
    .sort((first, second) => first.order - second.order);
  const index = columnBeats.findIndex((item) => item.id === target.id);
  const swapIndex = target.direction === "up" ? index - 1 : index + 1;
  const swapBeat = columnBeats[swapIndex];

  if (!swapBeat) return { ...project, storyBeats: normalizeStoryBeatOrders(project.storyBeats) };

  return {
    ...project,
    storyBeats: normalizeStoryBeatOrders(
      project.storyBeats.map((item) => {
        if (item.id === beat.id) return { ...item, order: swapBeat.order };
        if (item.id === swapBeat.id) return { ...item, order: beat.order };
        return item;
      })
    )
  };
}

export function deleteStoryBeat(project: ProjectDocument, storyBeatId: string): ProjectDocument {
  return {
    ...project,
    storyBeats: normalizeStoryBeatOrders(project.storyBeats.filter((beat) => beat.id !== storyBeatId))
  };
}
