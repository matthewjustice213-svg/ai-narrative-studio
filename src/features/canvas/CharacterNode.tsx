import { Handle, Position, type NodeProps } from "reactflow";
import type { Character } from "../../lib/schema.js";

export function CharacterNode({ data, selected }: NodeProps<Character>) {
  const initials = data.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className={`story-node character-node ${selected ? "selected" : ""}`}>
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
