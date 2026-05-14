import { memo, type CSSProperties } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { Scene } from "../../lib/schema.js";

function SceneNodeView({ data, selected }: NodeProps<Scene>) {
  const color = data.color || "#ffb15c";

  return (
    <article
      className={`story-node scene-node ${selected ? "selected" : ""}`}
      style={{ "--node-color": color } as CSSProperties}
    >
      <Handle type="target" position={Position.Left} />
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
      <Handle type="source" position={Position.Right} />
    </article>
  );
}

export function areSceneNodePropsEqual(previous: NodeProps<Scene>, next: NodeProps<Scene>) {
  return previous.data === next.data && previous.selected === next.selected;
}

export const SceneNode = memo(SceneNodeView, areSceneNodePropsEqual);
