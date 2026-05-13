export type StudioModuleId = "story" | "writer" | "characters" | "director" | "pitch" | "animate" | "capture";

export type StudioModule = {
  id: StudioModuleId;
  name: string;
  shortName: string;
  summary: string;
  placeholderTitle: string;
  placeholderDetail: string;
};

export const studioModules: StudioModule[] = [
  {
    id: "story",
    name: "BB Story",
    shortName: "Story",
    summary: "Node map",
    placeholderTitle: "Node story map",
    placeholderDetail: "The current visual scene and character canvas lives here."
  },
  {
    id: "writer",
    name: "BB Writer",
    shortName: "Writer",
    summary: "Script blocks",
    placeholderTitle: "Screenplay block editor",
    placeholderDetail: "Scene-linked script blocks, markdown export, and screenplay formatting come next."
  },
  {
    id: "characters",
    name: "BB Characters",
    shortName: "Cast",
    summary: "Profiles",
    placeholderTitle: "Character bible",
    placeholderDetail: "Profiles, arcs, relationships, voice notes, and reference images will collect here."
  },
  {
    id: "director",
    name: "BB Director",
    shortName: "Direct",
    summary: "Shots",
    placeholderTitle: "Director board",
    placeholderDetail: "Shot planning, camera notes, moodboards, and cinematic references will live here."
  },
  {
    id: "pitch",
    name: "BB Pitch",
    shortName: "Pitch",
    summary: "Decks",
    placeholderTitle: "Pitch room",
    placeholderDetail: "Loglines, one-sheets, lookbooks, and deck exports will be staged here."
  },
  {
    id: "animate",
    name: "BB Animate",
    shortName: "Animate",
    summary: "Motion",
    placeholderTitle: "Animation pipeline",
    placeholderDetail: "Storyboard-to-animation planning will connect here after Story and Writer are stable."
  },
  {
    id: "capture",
    name: "BB Capture",
    shortName: "Capture",
    summary: "Refs",
    placeholderTitle: "Reference capture",
    placeholderDetail: "Images, clips, screenshots, and field notes will be organized here."
  }
];
