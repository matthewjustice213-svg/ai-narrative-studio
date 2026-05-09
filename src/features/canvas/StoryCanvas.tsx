import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeDragHandler,
  type NodeMouseHandler,
  type OnConnect
} from "reactflow";
import "reactflow/dist/style.css";
import { useProjectStore } from "../../app/useProjectStore.js";
import { CharacterNode } from "./CharacterNode.js";
import { SceneNode } from "./SceneNode.js";

const nodeTypes = {
  scene: SceneNode,
  character: CharacterNode
};

export function StoryCanvas() {
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const selectScene = useProjectStore((state) => state.selectScene);
  const selectCharacter = useProjectStore((state) => state.selectCharacter);
  const updateScene = useProjectStore((state) => state.updateScene);
  const updateCharacter = useProjectStore((state) => state.updateCharacter);
  const replaceEdges = useProjectStore((state) => state.replaceEdges);

  const nodes: Node[] = useMemo(
    () => [
      ...project.scenes.map((scene) => ({
        id: scene.id,
        type: "scene",
        position: scene.position,
        data: scene,
        selected: selection?.type === "scene" && selection.id === scene.id
      })),
      ...project.characters.map((character) => ({
        id: character.id,
        type: "character",
        position: character.position,
        data: character,
        selected: selection?.type === "character" && selection.id === character.id
      }))
    ],
    [project.characters, project.scenes, selection]
  );

  const edges: Edge[] = useMemo(
    () =>
      project.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.type === "progression",
        style: { stroke: edge.color, strokeWidth: 2 }
      })),
    [project.edges]
  );

  const onConnect: OnConnect = async (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const next = addEdge(
      {
        ...connection,
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        label: "then",
        style: { stroke: "#38d8ff", strokeWidth: 2 }
      },
      edges
    );

    await replaceEdges(
      next.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "progression",
        label: String(edge.label || "then"),
        color: String(edge.style?.stroke || "#38d8ff")
      }))
    );
  };

  const onNodeClick: NodeMouseHandler = (_event, node) => {
    if (node.type === "scene") selectScene(node.id);
    if (node.type === "character") selectCharacter(node.id);
  };

  const onNodeDragStop: NodeDragHandler = async (_event, node) => {
    if (node.type === "scene") {
      await updateScene(node.id, { position: node.position });
    }

    if (node.type === "character") {
      await updateCharacter(node.id, { position: node.position });
    }
  };

  return (
    <section className="canvas-wrap">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
      >
        <Background color="#1c2838" gap={28} />
        <MiniMap nodeColor="#38d8ff" maskColor="rgba(6,7,11,.7)" />
        <Controls />
      </ReactFlow>
    </section>
  );
}
