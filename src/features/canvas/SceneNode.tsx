import { memo, type CSSProperties } from "react";
import { ChevronRight, Image as ImageIcon } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";
import { useProjectStore } from "../../app/useProjectStore.js";
import type { Scene } from "../../lib/schema.js";

function SceneNodeView({ data, selected }: NodeProps<Scene>) {
  const color = data.color || "#ffb15c";
  const updateScene = useProjectStore((state) => state.updateScene);
  const storyboardExpanded = Boolean(data.storyboardExpanded);

  return (
    <article
      className={`story-node scene-node ${selected ? "selected" : ""}`}
      style={{ "--node-color": color } as CSSProperties}
    >
      <Handle type="target" position={Position.Left} />
      <button
        type="button"
        className={`storyboard-toggle nodrag nopan ${storyboardExpanded ? "expanded" : ""}`}
        aria-label={storyboardExpanded ? "Collapse storyboard" : "Expand storyboard"}
        title={storyboardExpanded ? "Collapse storyboard" : "Expand storyboard"}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void updateScene(data.id, { storyboardExpanded: !storyboardExpanded });
        }}
      >
        <ChevronRight size={14} />
      </button>
      <div className="tone-strip" />
      <header>
        <strong>{data.title}</strong>
        <span>{data.runtimeEstimate}m</span>
      </header>
      <p>{data.summary || "No summary yet."}</p>
      <footer>
        {data.tags.slice(0, 3).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </footer>
      {storyboardExpanded ? (
        <div className="storyboard-tray nodrag nopan">
          {data.storyboardImagePath ? (
            <img src={data.storyboardImagePath} alt={`Storyboard for ${data.title}`} />
          ) : (
            <div className="storyboard-empty">
              <ImageIcon size={18} />
              <span>Right-click to import storyboard</span>
            </div>
          )}
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </article>
  );
}

export function areSceneNodePropsEqual(previous: NodeProps<Scene>, next: NodeProps<Scene>) {
  return previous.data === next.data && previous.selected === next.selected;
}

export const SceneNode = memo(SceneNodeView, areSceneNodePropsEqual);
