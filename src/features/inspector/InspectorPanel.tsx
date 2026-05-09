import { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "../../app/useProjectStore.js";

type SceneDraft = {
  title: string;
  summary: string;
  emotionalTone: string;
  runtimeEstimate: string;
  beatNotes: string;
  screenplayText: string;
};

type CharacterDraft = {
  name: string;
  role: string;
  bio: string;
  motivation: string;
  fear: string;
  dialogueStyle: string;
};

type GroupBoxDraft = {
  title: string;
  color: string;
  width: string;
  height: string;
};

export function InspectorPanel() {
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const updateScene = useProjectStore((state) => state.updateScene);
  const updateCharacter = useProjectStore((state) => state.updateCharacter);
  const updateGroupBox = useProjectStore((state) => state.updateGroupBox);

  const selectedScene = useMemo(
    () => (selection?.type === "scene" ? project.scenes.find((scene) => scene.id === selection.id) : null),
    [project.scenes, selection]
  );
  const selectedCharacter = useMemo(
    () =>
      selection?.type === "character"
        ? project.characters.find((character) => character.id === selection.id)
        : null,
    [project.characters, selection]
  );
  const selectedGroupBox = useMemo(
    () =>
      selection?.type === "groupBox"
        ? project.groupBoxes.find((groupBox) => groupBox.id === selection.id)
        : null,
    [project.groupBoxes, selection]
  );

  const [sceneDraft, setSceneDraft] = useState<SceneDraft | null>(null);
  const [characterDraft, setCharacterDraft] = useState<CharacterDraft | null>(null);
  const [groupBoxDraft, setGroupBoxDraft] = useState<GroupBoxDraft | null>(null);

  useEffect(() => {
    if (!selectedScene) {
      setSceneDraft(null);
      return;
    }

    setSceneDraft({
      title: selectedScene.title,
      summary: selectedScene.summary,
      emotionalTone: selectedScene.emotionalTone,
      runtimeEstimate: String(selectedScene.runtimeEstimate),
      beatNotes: selectedScene.beatNotes,
      screenplayText: selectedScene.screenplayText
    });
  }, [selectedScene]);

  useEffect(() => {
    if (!selectedCharacter) {
      setCharacterDraft(null);
      return;
    }

    setCharacterDraft({
      name: selectedCharacter.name,
      role: selectedCharacter.role,
      bio: selectedCharacter.bio,
      motivation: selectedCharacter.motivation,
      fear: selectedCharacter.fear,
      dialogueStyle: selectedCharacter.dialogueStyle
    });
  }, [selectedCharacter]);

  useEffect(() => {
    if (!selectedGroupBox) {
      setGroupBoxDraft(null);
      return;
    }

    setGroupBoxDraft({
      title: selectedGroupBox.title,
      color: selectedGroupBox.color,
      width: String(selectedGroupBox.width),
      height: String(selectedGroupBox.height)
    });
  }, [selectedGroupBox]);

  if (selectedScene && sceneDraft) {
    const saveDraft = () => {
      const runtimeEstimate = Number(sceneDraft.runtimeEstimate);
      void updateScene(selectedScene.id, {
        title: sceneDraft.title,
        summary: sceneDraft.summary,
        emotionalTone: sceneDraft.emotionalTone,
        runtimeEstimate: Number.isFinite(runtimeEstimate) ? Math.max(0, runtimeEstimate) : 0,
        beatNotes: sceneDraft.beatNotes,
        screenplayText: sceneDraft.screenplayText
      });
    };

    return (
      <aside className="inspector-panel">
        <h2>Scene Inspector</h2>
        <label>
          Title
          <input
            value={sceneDraft.title}
            onChange={(event) => setSceneDraft({ ...sceneDraft, title: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Summary
          <textarea
            value={sceneDraft.summary}
            onChange={(event) => setSceneDraft({ ...sceneDraft, summary: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Tone
          <input
            value={sceneDraft.emotionalTone}
            onChange={(event) => setSceneDraft({ ...sceneDraft, emotionalTone: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Runtime Estimate
          <input
            type="number"
            min={0}
            value={sceneDraft.runtimeEstimate}
            onChange={(event) => setSceneDraft({ ...sceneDraft, runtimeEstimate: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Beat Notes
          <textarea
            value={sceneDraft.beatNotes}
            onChange={(event) => setSceneDraft({ ...sceneDraft, beatNotes: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Screenplay Text
          <textarea
            className="screenplay-field"
            value={sceneDraft.screenplayText}
            onChange={(event) => setSceneDraft({ ...sceneDraft, screenplayText: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
      </aside>
    );
  }

  if (selectedCharacter && characterDraft) {
    const saveDraft = () => {
      void updateCharacter(selectedCharacter.id, characterDraft);
    };

    return (
      <aside className="inspector-panel">
        <h2>Character Inspector</h2>
        <label>
          Name
          <input
            value={characterDraft.name}
            onChange={(event) => setCharacterDraft({ ...characterDraft, name: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Role
          <input
            value={characterDraft.role}
            onChange={(event) => setCharacterDraft({ ...characterDraft, role: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Bio
          <textarea
            value={characterDraft.bio}
            onChange={(event) => setCharacterDraft({ ...characterDraft, bio: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Motivation
          <textarea
            value={characterDraft.motivation}
            onChange={(event) => setCharacterDraft({ ...characterDraft, motivation: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Fear
          <textarea
            value={characterDraft.fear}
            onChange={(event) => setCharacterDraft({ ...characterDraft, fear: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Dialogue Style
          <textarea
            value={characterDraft.dialogueStyle}
            onChange={(event) => setCharacterDraft({ ...characterDraft, dialogueStyle: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
      </aside>
    );
  }

  if (selectedGroupBox && groupBoxDraft) {
    const saveDraft = () => {
      const width = Number(groupBoxDraft.width);
      const height = Number(groupBoxDraft.height);
      void updateGroupBox(selectedGroupBox.id, {
        title: groupBoxDraft.title.trim() || "Group Box",
        color: groupBoxDraft.color.trim() || "#38d8ff",
        width: Number.isFinite(width) ? Math.max(160, width) : 520,
        height: Number.isFinite(height) ? Math.max(120, height) : 320
      });
    };

    return (
      <aside className="inspector-panel">
        <h2>Box Inspector</h2>
        <label>
          Label
          <input
            value={groupBoxDraft.title}
            onChange={(event) => setGroupBoxDraft({ ...groupBoxDraft, title: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Color
          <input
            value={groupBoxDraft.color}
            onChange={(event) => setGroupBoxDraft({ ...groupBoxDraft, color: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Width
          <input
            type="number"
            min={160}
            value={groupBoxDraft.width}
            onChange={(event) => setGroupBoxDraft({ ...groupBoxDraft, width: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
        <label>
          Height
          <input
            type="number"
            min={120}
            value={groupBoxDraft.height}
            onChange={(event) => setGroupBoxDraft({ ...groupBoxDraft, height: event.target.value })}
            onBlur={saveDraft}
          />
        </label>
      </aside>
    );
  }

  return (
    <aside className="inspector-panel">
      <h2>Inspector</h2>
      <p className="muted">Select a scene or character node to edit story details.</p>
    </aside>
  );
}
