import { Handle, Position, type NodeProps } from "reactflow";
import type { Scene } from "../../lib/schema.js";

export function SceneNode({ data, selected }: NodeProps<Scene>) {
  return (
    <article className={`story-node scene-node ${selected ? "selected" : ""}`}>
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
