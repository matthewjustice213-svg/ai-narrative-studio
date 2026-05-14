import { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "../../app/useProjectStore.js";

type DirectorDraft = {
  directorNotes: string;
  cameraNotes: string;
  shotList: string;
  lightingNotes: string;
  soundNotes: string;
};

export function DirectorWorkspace() {
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const selectScene = useProjectStore((state) => state.selectScene);
  const updateScene = useProjectStore((state) => state.updateScene);
  const activeScene = useMemo(() => {
    if (selection?.type === "scene") {
      return project.scenes.find((scene) => scene.id === selection.id) ?? project.scenes[0] ?? null;
    }

    return project.scenes[0] ?? null;
  }, [project.scenes, selection]);
  const linkedReferences = useMemo(
    () => (activeScene ? project.references.filter((reference) => reference.linkedSceneIds.includes(activeScene.id)) : []),
    [activeScene, project.references]
  );
  const [draft, setDraft] = useState<DirectorDraft | null>(null);

  useEffect(() => {
    if (!activeScene) {
      setDraft(null);
      return;
    }

    setDraft({
      directorNotes: activeScene.directorNotes,
      cameraNotes: activeScene.cameraNotes,
      shotList: activeScene.shotList,
      lightingNotes: activeScene.lightingNotes,
      soundNotes: activeScene.soundNotes
    });
  }, [activeScene]);

  const saveDraft = (nextDraft = draft) => {
    if (!activeScene || !nextDraft) return;

    void updateScene(activeScene.id, nextDraft);
  };

  return (
    <section className="director-workspace" aria-label="BB Director workspace">
      <aside className="director-scene-list">
        <header>
          <div>
            <span className="eyebrow">BB Director</span>
            <h2>Scenes</h2>
          </div>
        </header>
        <div>
          {project.scenes.map((scene) => (
            <button
              key={scene.id}
              className={activeScene?.id === scene.id ? "list-row active" : "list-row"}
              onClick={() => selectScene(scene.id)}
            >
              <span>{scene.title}</span>
              <small>{scene.runtimeEstimate} min</small>
            </button>
          ))}
        </div>
      </aside>

      {activeScene && draft ? (
        <>
          <section className="director-board">
            <header className="director-header">
              <div>
                <span className="eyebrow">Shot Planner</span>
                <h2>{activeScene.title}</h2>
              </div>
              <small>{activeScene.emotionalTone}</small>
            </header>

            <div className="director-fields">
              <label className="director-field full">
                Director Notes
                <textarea
                  value={draft.directorNotes}
                  onChange={(event) => setDraft({ ...draft, directorNotes: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
              <label className="director-field">
                Camera Notes
                <textarea
                  value={draft.cameraNotes}
                  onChange={(event) => setDraft({ ...draft, cameraNotes: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
              <label className="director-field">
                Shot List
                <textarea
                  value={draft.shotList}
                  onChange={(event) => setDraft({ ...draft, shotList: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
              <label className="director-field">
                Lighting Notes
                <textarea
                  value={draft.lightingNotes}
                  onChange={(event) => setDraft({ ...draft, lightingNotes: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
              <label className="director-field">
                Sound Notes
                <textarea
                  value={draft.soundNotes}
                  onChange={(event) => setDraft({ ...draft, soundNotes: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
            </div>
          </section>

          <aside className="director-reference">
            <header>
              <span className="eyebrow">Scene Pulse</span>
              <h2>Beat Context</h2>
            </header>
            <section>
              <h3>Summary</h3>
              <p>{activeScene.summary || "No scene summary yet."}</p>
            </section>
            <section>
              <h3>Beat Notes</h3>
              <p>{activeScene.beatNotes || "No beat notes yet."}</p>
            </section>
            <section>
              <h3>Tags</h3>
              <p>{activeScene.tags.length > 0 ? activeScene.tags.join(", ") : "No tags yet."}</p>
            </section>
            <section>
              <h3>Scene References</h3>
              {linkedReferences.length > 0 ? (
                <div className="scene-reference-list">
                  {linkedReferences.map((reference) => (
                    <article key={reference.id} className="scene-reference-card">
                      {reference.imagePath ? <img src={reference.imagePath} alt={reference.title} /> : null}
                      <strong>{reference.title}</strong>
                      <p>{reference.notes || reference.tags.join(", ") || "No reference notes yet."}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No linked references yet.</p>
              )}
            </section>
          </aside>
        </>
      ) : (
        <section className="director-empty">
          <h2>Shot Planner</h2>
          <p className="muted">Create a scene before planning shots.</p>
        </section>
      )}
    </section>
  );
}
