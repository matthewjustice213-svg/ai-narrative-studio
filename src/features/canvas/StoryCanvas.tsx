import { useMemo, useState } from "react";
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
  type NodeTypes,
  type OnConnect,
  type ReactFlowInstance
} from "reactflow";
import "reactflow/dist/style.css";
import { useProjectStore } from "../../app/useProjectStore.js";
import { CharacterNode } from "./CharacterNode.js";
import { GroupBoxNode } from "./GroupBoxNode.js";
import { SceneNode } from "./SceneNode.js";

const colorOptions = ["#38d8ff", "#ff4fd8", "#ffb15c", "#7cff9b", "#9f7cff"];

type MenuTarget =
  | { type: "scene"; id: string }
  | { type: "character"; id: string }
  | { type: "groupBox"; id: string }
  | { type: "pane" };

type CanvasMenu = {
  x: number;
  y: number;
  flowPosition: { x: number; y: number };
  target: MenuTarget;
};

export function StoryCanvas() {
  const [menu, setMenu] = useState<CanvasMenu | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const selectScene = useProjectStore((state) => state.selectScene);
  const selectCharacter = useProjectStore((state) => state.selectCharacter);
  const selectGroupBox = useProjectStore((state) => state.selectGroupBox);
  const updateScene = useProjectStore((state) => state.updateScene);
  const updateCharacter = useProjectStore((state) => state.updateCharacter);
  const updateGroupBox = useProjectStore((state) => state.updateGroupBox);
  const setNodeColor = useProjectStore((state) => state.setNodeColor);
  const deleteNode = useProjectStore((state) => state.deleteNode);
  const deleteGroupBox = useProjectStore((state) => state.deleteGroupBox);
  const createGroupBox = useProjectStore((state) => state.createGroupBox);
  const createGroupBoxAround = useProjectStore((state) => state.createGroupBoxAround);
  const selectCharacterAvatarWithDialog = useProjectStore((state) => state.selectCharacterAvatarWithDialog);
  const replaceEdges = useProjectStore((state) => state.replaceEdges);
  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      scene: SceneNode,
      character: CharacterNode,
      groupBox: GroupBoxNode
    }),
    []
  );

  const nodes: Node[] = useMemo(
    () => [
      ...project.groupBoxes.map((groupBox) => ({
        id: groupBox.id,
        type: "groupBox",
        position: groupBox.position,
        data: groupBox,
        selected: selection?.type === "groupBox" && selection.id === groupBox.id,
        style: { width: groupBox.width, height: groupBox.height },
        zIndex: 0
      })),
      ...project.scenes.map((scene) => ({
        id: scene.id,
        type: "scene",
        position: scene.position,
        data: scene,
        selected: selection?.type === "scene" && selection.id === scene.id,
        zIndex: 2
      })),
      ...project.characters.map((character) => ({
        id: character.id,
        type: "character",
        position: character.position,
        data: character,
        selected: selection?.type === "character" && selection.id === character.id,
        zIndex: 2
      }))
    ],
    [project.characters, project.groupBoxes, project.scenes, selection]
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
    if (node.type === "groupBox") selectGroupBox(node.id);
  };

  const openNodeMenu: NodeMouseHandler = (event, node) => {
    event.preventDefault();
    if (node.type === "scene") selectScene(node.id);
    if (node.type === "character") selectCharacter(node.id);
    if (node.type === "groupBox") selectGroupBox(node.id);

    if (node.type === "scene" || node.type === "character" || node.type === "groupBox") {
      setMenu({
        x: event.clientX,
        y: event.clientY,
        flowPosition: node.position,
        target: { type: node.type, id: node.id }
      });
    }
  };

  const openPaneMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    const flowPosition = reactFlowInstance?.screenToFlowPosition({ x: event.clientX, y: event.clientY }) ?? {
      x: 120,
      y: 120
    };
    setMenu({ x: event.clientX, y: event.clientY, flowPosition, target: { type: "pane" } });
  };

  const onNodeDragStop: NodeDragHandler = async (_event, node) => {
    if (node.type === "scene") {
      await updateScene(node.id, { position: node.position });
    }

    if (node.type === "character") {
      await updateCharacter(node.id, { position: node.position });
    }

    if (node.type === "groupBox") {
      await updateGroupBox(node.id, { position: node.position });
    }
  };

  return (
    <section className="canvas-wrap">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onInit={setReactFlowInstance}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeContextMenu={openNodeMenu}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={() => setMenu(null)}
        onPaneContextMenu={openPaneMenu}
      >
        <Background color="#1c2838" gap={28} />
        <MiniMap nodeColor="#38d8ff" maskColor="rgba(6,7,11,.7)" />
        <Controls />
      </ReactFlow>
      {menu ? (
        <CanvasContextMenu
          menu={menu}
          onClose={() => setMenu(null)}
          onCreateGroupBox={() => createGroupBox(menu.flowPosition)}
          onCreateGroupAround={createGroupBoxAround}
          onSetNodeColor={setNodeColor}
          onSetGroupColor={(id, color) => updateGroupBox(id, { color })}
          onRenameGroup={(id) => {
            const groupBox = project.groupBoxes.find((box) => box.id === id);
            const title = window.prompt("Group label", groupBox?.title || "Group Box");
            if (title?.trim()) void updateGroupBox(id, { title: title.trim() });
          }}
          onDeleteNode={deleteNode}
          onDeleteGroupBox={deleteGroupBox}
          onImportCharacterAvatar={selectCharacterAvatarWithDialog}
        />
      ) : null}
    </section>
  );
}

type CanvasContextMenuProps = {
  menu: CanvasMenu;
  onClose(): void;
  onCreateGroupBox(): Promise<void>;
  onCreateGroupAround(nodeType: "scene" | "character"): Promise<void>;
  onSetNodeColor(type: "scene" | "character", id: string, color: string | null): Promise<void>;
  onSetGroupColor(id: string, color: string): Promise<void>;
  onRenameGroup(id: string): void;
  onDeleteNode(type: "scene" | "character", id: string): Promise<void>;
  onDeleteGroupBox(id: string): Promise<void>;
  onImportCharacterAvatar(id: string): Promise<void>;
};

function CanvasContextMenu({
  menu,
  onClose,
  onCreateGroupBox,
  onCreateGroupAround,
  onSetNodeColor,
  onSetGroupColor,
  onRenameGroup,
  onDeleteNode,
  onDeleteGroupBox,
  onImportCharacterAvatar
}: CanvasContextMenuProps) {
  const run = (action: () => void | Promise<void>) => {
    void Promise.resolve(action()).finally(onClose);
  };

  if (menu.target.type === "pane") {
    return (
      <div
        className="canvas-menu"
        style={{ left: menu.x, top: menu.y }}
        onContextMenu={(event) => event.preventDefault()}
      >
        <button onClick={() => run(onCreateGroupBox)}>New group box here</button>
        <button onClick={() => run(() => onCreateGroupAround("scene"))}>Box story scenes</button>
        <button onClick={() => run(() => onCreateGroupAround("character"))}>Box characters</button>
      </div>
    );
  }

  if (menu.target.type === "groupBox") {
    const target = menu.target;

    return (
      <div
        className="canvas-menu"
        style={{ left: menu.x, top: menu.y }}
        onContextMenu={(event) => event.preventDefault()}
      >
        <button onClick={() => run(() => onRenameGroup(target.id))}>Rename box</button>
        <span>Box color</span>
        <div className="color-menu">
          {colorOptions.map((color) => (
            <button key={color} title={color} style={{ background: color }} onClick={() => run(() => onSetGroupColor(target.id, color))} />
          ))}
        </div>
        <button className="danger-action" onClick={() => run(() => onDeleteGroupBox(target.id))}>
          Delete box
        </button>
      </div>
    );
  }

  const target = menu.target;

  return (
    <div className="canvas-menu" style={{ left: menu.x, top: menu.y }} onContextMenu={(event) => event.preventDefault()}>
      <span>Node color</span>
      <div className="color-menu">
        {colorOptions.map((color) => (
          <button
            key={color}
            title={color}
            style={{ background: color }}
            onClick={() => run(() => onSetNodeColor(target.type, target.id, color))}
          />
        ))}
        <button
          className="clear-swatch"
          title="Clear color"
          onClick={() => run(() => onSetNodeColor(target.type, target.id, null))}
        />
      </div>
      {target.type === "character" ? (
        <button onClick={() => run(() => onImportCharacterAvatar(target.id))}>Import avatar</button>
      ) : null}
      <button onClick={() => run(() => onCreateGroupAround(target.type))}>
        {target.type === "scene" ? "Box story scenes" : "Box characters"}
      </button>
      <button className="danger-action" onClick={() => run(() => onDeleteNode(target.type, target.id))}>
        Delete node
      </button>
    </div>
  );
}
