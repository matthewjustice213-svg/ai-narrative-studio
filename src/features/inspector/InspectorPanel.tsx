import { useMemo } from "react";
import { useProjectStore } from "../../app/useProjectStore.js";

export function InspectorPanel() {
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const updateScene = useProjectStore((state) => state.updateScene);

  const selectedScene = useMemo(
    () => (selection?.type === "scene" ? project.scenes.find((scene) => scene.id === selection.id) : null),
    [project.scenes, selection]
  );

  if (!selectedScene) {
    return (
      <aside className="inspector-panel">
        <h2>Inspector</h2>
        <p className="muted">Select a scene node to edit story details.</p>
      </aside>
    );
  }

  return (
    <aside className="inspector-panel">
      <h2>Scene Inspector</h2>
      <label>
        Title
        <input
          value={selectedScene.title}
          onChange={(event) => void updateScene(selectedScene.id, { title: event.target.value })}
        />
      </label>
      <label>
        Summary
        <textarea
          value={selectedScene.summary}
          onChange={(event) => void updateScene(selectedScene.id, { summary: event.target.value })}
        />
      </label>
      <label>
        Tone
        <input
          value={selectedScene.emotionalTone}
          onChange={(event) => void updateScene(selectedScene.id, { emotionalTone: event.target.value })}
        />
      </label>
      <label>
        Runtime Estimate
        <input
          type="number"
          min={0}
          value={selectedScene.runtimeEstimate}
          onChange={(event) => void updateScene(selectedScene.id, { runtimeEstimate: Number(event.target.value) })}
        />
      </label>
      <label>
        Beat Notes
        <textarea
          value={selectedScene.beatNotes}
          onChange={(event) => void updateScene(selectedScene.id, { beatNotes: event.target.value })}
        />
      </label>
      <label>
        Screenplay Text
        <textarea
          className="screenplay-field"
          value={selectedScene.screenplayText}
          onChange={(event) => void updateScene(selectedScene.id, { screenplayText: event.target.value })}
        />
      </label>
    </aside>
  );
}
