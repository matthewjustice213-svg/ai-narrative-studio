import type { ProjectDocument } from "./schema.js";

export function createSeedProject(): ProjectDocument {
  const now = new Date().toISOString();
  return {
    id: "project-demo",
    title: "Untitled Story",
    createdAt: now,
    updatedAt: now,
    settings: {
      model: "gpt-5.4-mini",
      projectPath: null
    },
    storyBeats: [
      {
        id: "beat-opening-pressure",
        title: "Opening pressure",
        summary: "Fries tries to look in control while the room proves otherwise.",
        columnId: "act_1",
        color: "#38d8ff",
        tags: ["opening", "pressure"],
        order: 0
      },
      {
        id: "beat-bad-news",
        title: "Bad news arrives",
        summary: "A tiny problem becomes impossible to ignore.",
        columnId: "act_2a",
        color: "#ffb15c",
        tags: ["escalation"],
        order: 0
      },
      {
        id: "beat-false-confidence",
        title: "False confidence",
        summary: "Fries chooses performance over honesty.",
        columnId: "act_2b",
        color: "#ff4fd8",
        tags: ["turn"],
        order: 0
      }
    ],
    groupBoxes: [],
    scenes: [
      {
        id: "scene-opening",
        title: "Opening Image",
        summary: "The protagonist tries to look in control while the room proves otherwise.",
        screenplayText: "INT. FOOD TRUCK - NIGHT\n\nThe receipt printer screams. Fries stares it down.",
        beatNotes: "Introduce pressure, status anxiety, and comic denial.",
        emotionalTone: "anxious comedy",
        runtimeEstimate: 2,
        tags: ["opening", "pressure"],
        linkedCharacterIds: ["char-fries"],
        color: null,
        position: { x: 80, y: 90 }
      },
      {
        id: "scene-complication",
        title: "Bad News Arrives",
        summary: "A tiny problem becomes impossible to ignore.",
        screenplayText: "",
        beatNotes: "Escalate from inconvenience to public embarrassment.",
        emotionalTone: "rising panic",
        runtimeEstimate: 3,
        tags: ["escalation"],
        linkedCharacterIds: ["char-fries"],
        color: null,
        position: { x: 420, y: 210 }
      },
      {
        id: "scene-turn",
        title: "The Choice",
        summary: "The protagonist chooses performance over honesty.",
        screenplayText: "",
        beatNotes: "Force a decision that creates the next sequence.",
        emotionalTone: "false confidence",
        runtimeEstimate: 2,
        tags: ["turn"],
        linkedCharacterIds: ["char-fries"],
        color: null,
        position: { x: 760, y: 120 }
      }
    ],
    characters: [
      {
        id: "char-fries",
        name: "Fries",
        role: "Owner-operator",
        bio: "A fast-talking creator who treats every small failure like a public trial.",
        motivation: "Look successful before feeling successful.",
        fear: "Being seen as a fraud.",
        dialogueStyle: "Deflects with jokes before admitting the truth.",
        avatarPath: null,
        linkedSceneIds: ["scene-opening", "scene-complication", "scene-turn"],
        color: null,
        position: { x: 420, y: 520 }
      }
    ],
    edges: [
      {
        id: "edge-opening-complication",
        source: "scene-opening",
        target: "scene-complication",
        type: "progression",
        label: "then",
        color: "#38d8ff"
      },
      {
        id: "edge-complication-turn",
        source: "scene-complication",
        target: "scene-turn",
        type: "progression",
        label: "therefore",
        color: "#ffb15c"
      }
    ],
    personas: [],
    aiNotes: []
  };
}
