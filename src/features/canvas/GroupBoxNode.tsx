import { memo, type CSSProperties } from "react";
import type { NodeProps } from "reactflow";
import type { GroupBox } from "../../lib/schema.js";

function GroupBoxNodeView({ data, selected }: NodeProps<GroupBox>) {
  return (
    <article
      className={`group-box-node ${selected ? "selected" : ""}`}
      style={{ "--group-color": data.color } as CSSProperties}
    >
      <header>{data.title}</header>
    </article>
  );
}

export function areGroupBoxNodePropsEqual(previous: NodeProps<GroupBox>, next: NodeProps<GroupBox>) {
  return previous.data === next.data && previous.selected === next.selected;
}

export const GroupBoxNode = memo(GroupBoxNodeView, areGroupBoxNodePropsEqual);
