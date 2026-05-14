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
    pitch: {
      logline: "A fast-talking food truck owner tries to look successful while one tiny disaster exposes the whole act.",
      synopsis:
        "Fries keeps selling confidence until the night forces a choice between performing success and telling the truth.",
      tone: "Anxious workplace comedy with cinematic pressure.",
      audience: "Indie comedy viewers, YouTube creators, and short-form story fans.",
      comps: ["The Bear", "Abbott Elementary", "Clerks"],
      oneSheetNotes: "Lead with the trapped food truck visual, the receipt printer gag, and Fries' fear of being exposed."
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
        directorNotes: "Keep the frame tight enough that the workspace feels trapped.",
        cameraNotes: "Locked-off wide until the receipt printer screams, then push into Fries.",
        shotList: "Wide master of the truck\nInsert receipt printer\nClose on Fries trying not to blink",
        lightingNotes: "Cold service-window spill with a warm grill edge.",
        soundNotes: "Receipt printer cuts through the room before any dialogue lands.",
        storyboardImagePath: null,
        storyboardExpanded: false,
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
        directorNotes: "",
        cameraNotes: "",
        shotList: "",
        lightingNotes: "",
        soundNotes: "",
        storyboardImagePath: null,
        storyboardExpanded: false,
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
        directorNotes: "",
        cameraNotes: "",
        shotList: "",
        lightingNotes: "",
        soundNotes: "",
        storyboardImagePath: null,
        storyboardExpanded: false,
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
