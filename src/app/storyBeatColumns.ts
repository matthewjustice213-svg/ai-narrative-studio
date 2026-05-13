import type { StoryBeatColumnId } from "../lib/schema.js";

export type StoryBeatColumn = {
  id: StoryBeatColumnId;
  label: string;
};

export const storyBeatColumns: StoryBeatColumn[] = [
  { id: "unassigned", label: "Unassigned" },
  { id: "act_1", label: "Act 1" },
  { id: "act_2a", label: "Act 2A" },
  { id: "midpoint", label: "Midpoint" },
  { id: "act_2b", label: "Act 2B" },
  { id: "act_3", label: "Act 3" }
];
