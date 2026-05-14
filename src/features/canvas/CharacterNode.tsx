import { memo, type CSSProperties } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { Character } from "../../lib/schema.js";

function CharacterNodeView({ data, selected }: NodeProps<Character>) {
  const initials = data.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const color = data.color || "#ff4fd8";

  return (
    <article
      className={`story-node character-node ${selected ? "selected" : ""}`}
      style={{ "--node-color": color } as CSSProperties}
    >
      <Handle type="target" position={Position.Left} />
      <div className="avatar">{data.avatarPath ? <img src={data.avatarPath} alt="" /> : initials}</div>
      <div>
        <strong>{data.name}</strong>
        <span>{data.role}</span>
        <p>{data.bio}</p>
      </div>
      <Handle type="source" position={Position.Right} />
    </article>
  );
}

export function areCharacterNodePropsEqual(previous: NodeProps<Character>, next: NodeProps<Character>) {
  return previous.data === next.data && previous.selected === next.selected;
}

export const CharacterNode = memo(CharacterNodeView, areCharacterNodePropsEqual);
