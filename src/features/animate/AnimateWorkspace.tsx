import { useEffect, useMemo, useState } from "react";
import { Film, Image as ImageIcon } from "lucide-react";
import { useProjectStore } from "../../app/useProjectStore.js";

type AnimateDraft = {
  animationStatus: "rough" | "blocked" | "animating" | "review" | "locked";
  animationAction: string;
  animationTiming: string;
  animationAudio: string;
};

const statusLabels: Record<AnimateDraft["animationStatus"], string> = {
  rough: "Rough",
  blocked: "Blocked",
  animating: "Animating",
  review: "Review",
  locked: "Locked"
};

export function AnimateWorkspace() {
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
  const [draft, setDraft] = useState<AnimateDraft | null>(null);

  useEffect(() => {
    if (!activeScene) {
      setDraft(null);
      return;
    }

    setDraft({
      animationStatus: activeScene.animationStatus,
      animationAction: activeScene.animationAction,
      animationTiming: activeScene.animationTiming,
      animationAudio: activeScene.animationAudio
    });
  }, [activeScene]);

  const saveDraft = (nextDraft = draft) => {
    if (!activeScene || !nextDraft) return;

    void updateScene(activeScene.id, nextDraft);
  };

  const totalRuntime = project.scenes.reduce((sum, scene) => sum + scene.runtimeEstimate, 0);

  return (
    <section className="animate-workspace" aria-label="BB Animate workspace">
      <aside className="animate-scenes">
        <header>
          <div>
            <span className="eyebrow">BB Animate</span>
            <h2>Animatic Board</h2>
          </div>
          <small>{totalRuntime} min</small>
        </header>
        <div>
          {project.scenes.map((scene) => (
            <button
              key={scene.id}
              className={activeScene?.id === scene.id ? "list-row active" : "list-row"}
              onClick={() => selectScene(scene.id)}
            >
              <span>{scene.title}</span>
              <small>{statusLabels[scene.animationStatus]}</small>
            </button>
          ))}
        </div>
      </aside>

      {activeScene && draft ? (
        <>
          <section className="animate-editor">
            <header className="animate-header">
              <div>
                <span className="eyebrow">Scene Motion</span>
                <h2>{activeScene.title}</h2>
              </div>
              <small>{activeScene.runtimeEstimate} min</small>
            </header>

            <div className="animate-fields">
              <label className="animate-field">
                Animation Status
                <select
                  value={draft.animationStatus}
                  onChange={(event) => {
                    const nextDraft = {
                      ...draft,
                      animationStatus: event.target.value as AnimateDraft["animationStatus"]
                    };
                    setDraft(nextDraft);
                    saveDraft(nextDraft);
                  }}
                >
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="animate-field full">
                Action / Motion Notes
                <textarea
                  value={draft.animationAction}
                  onChange={(event) => setDraft({ ...draft, animationAction: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
              <label className="animate-field">
                Timing Notes
                <textarea
                  value={draft.animationTiming}
                  onChange={(event) => setDraft({ ...draft, animationTiming: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
              <label className="animate-field">
                Audio Notes
                <textarea
                  value={draft.animationAudio}
                  onChange={(event) => setDraft({ ...draft, animationAudio: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
            </div>
          </section>

          <aside className="animate-preview">
            <span className="eyebrow">Animatic Frame</span>
            <h2>Storyboard Preview</h2>
            {activeScene.storyboardImagePath ? (
              <img src={activeScene.storyboardImagePath} alt={`Storyboard for ${activeScene.title}`} />
            ) : (
              <div className="animate-preview-empty">
                <ImageIcon size={30} />
                <p>No storyboard image yet.</p>
              </div>
            )}
            <section>
              <h3>Scene Context</h3>
              <p>{activeScene.summary || "No scene summary yet."}</p>
            </section>
            <section>
              <h3>Animation Beat</h3>
              <p>{draft.animationAction || "Add the physical action, camera move, or key pose idea."}</p>
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
        <section className="animate-empty">
          <Film size={30} />
          <h2>Animatic Board</h2>
          <p className="muted">Create a scene before planning animation beats.</p>
        </section>
      )}
    </section>
  );
}
