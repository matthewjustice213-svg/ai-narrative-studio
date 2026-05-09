import type { CSSProperties } from "react";
import type { NodeProps } from "reactflow";
import type { GroupBox } from "../../lib/schema.js";

export function GroupBoxNode({ data, selected }: NodeProps<GroupBox>) {
  return (
    <article
      className={`group-box-node ${selected ? "selected" : ""}`}
      style={{ "--group-color": data.color } as CSSProperties}
    >
      <header>{data.title}</header>
    </article>
  );
}
