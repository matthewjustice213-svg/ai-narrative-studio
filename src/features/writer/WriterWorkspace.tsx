import { useEffect, useMemo, useRef, useState } from "react";
import { useProjectStore } from "../../app/useProjectStore.js";
import { exportProjectMarkdown } from "./screenplayExport.js";

type SceneDraft = {
  title: string;
  summary: string;
  screenplayText: string;
};

const screenplaySnippets = [
  { label: "Scene Heading", text: "INT. LOCATION - DAY\n\n" },
  { label: "Action", text: "Action line.\n\n" },
  { label: "Character", text: "CHARACTER\n" },
  { label: "Dialogue", text: "    Dialogue line.\n\n" }
];

export function WriterWorkspace() {
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const selectScene = useProjectStore((state) => state.selectScene);
  const createScene = useProjectStore((state) => state.createScene);
  const updateScene = useProjectStore((state) => state.updateScene);
  const screenplayRef = useRef<HTMLTextAreaElement | null>(null);
  const activeScene = useMemo(() => {
    if (selection?.type === "scene") {
      return project.scenes.find((scene) => scene.id === selection.id) ?? project.scenes[0] ?? null;
    }

    return project.scenes[0] ?? null;
  }, [project.scenes, selection]);
  const [draft, setDraft] = useState<SceneDraft | null>(null);
  const [markdownExport, setMarkdownExport] = useState("");

  useEffect(() => {
    if (!activeScene) {
      setDraft(null);
      return;
    }

    setDraft({
      title: activeScene.title,
      summary: activeScene.summary,
      screenplayText: activeScene.screenplayText
    });
  }, [activeScene]);

  const saveDraft = () => {
    if (!activeScene || !draft) return;

    void updateScene(activeScene.id, {
      title: draft.title.trim() || "Untitled Scene",
      summary: draft.summary,
      screenplayText: draft.screenplayText
    });
  };

  const projectWithCurrentDraft = () => {
    if (!activeScene || !draft) return project;

    return {
      ...project,
      scenes: project.scenes.map((scene) =>
        scene.id === activeScene.id
          ? {
              ...scene,
              title: draft.title.trim() || "Untitled Scene",
              summary: draft.summary,
              screenplayText: draft.screenplayText
            }
          : scene
      )
    };
  };

  const insertSnippet = (snippet: string) => {
    if (!draft) return;

    const textarea = screenplayRef.current;
    const start = textarea?.selectionStart ?? draft.screenplayText.length;
    const end = textarea?.selectionEnd ?? start;
    const nextText = `${draft.screenplayText.slice(0, start)}${snippet}${draft.screenplayText.slice(end)}`;
    setDraft({ ...draft, screenplayText: nextText });

    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  return (
    <section className="writer-workspace" aria-label="BB Writer workspace">
      <aside className="writer-scene-list">
        <header>
          <div>
            <span className="eyebrow">BB Writer</span>
            <h2>Scenes</h2>
          </div>
          <button className="icon-button text-button" onClick={() => void createScene()}>
            New Scene
          </button>
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
        <section className="writer-editor">
          <header className="writer-header">
            <div>
              <span className="eyebrow">Scene Script</span>
              <h2>{activeScene.title}</h2>
            </div>
            <button
              className="icon-button text-button"
              onClick={() => setMarkdownExport(exportProjectMarkdown(projectWithCurrentDraft()))}
            >
              Export Markdown
            </button>
          </header>

          <div className="writer-fields">
            <label className="writer-field">
              Scene Title
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                onBlur={saveDraft}
              />
            </label>
            <label className="writer-field">
              Scene Summary
              <textarea
                value={draft.summary}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                onBlur={saveDraft}
              />
            </label>
          </div>

          <div className="writer-toolbar" aria-label="Screenplay quick inserts">
            {screenplaySnippets.map((snippet) => (
              <button key={snippet.label} className="icon-button text-button" onClick={() => insertSnippet(snippet.text)}>
                {snippet.label}
              </button>
            ))}
          </div>

          <label className="writer-script-field">
            Screenplay Text
            <textarea
              ref={screenplayRef}
              className="screenplay-editor"
              value={draft.screenplayText}
              onChange={(event) => setDraft({ ...draft, screenplayText: event.target.value })}
              onBlur={saveDraft}
            />
          </label>
        </section>
      ) : (
        <section className="writer-empty">
          <h2>Scene Script</h2>
          <p className="muted">Create a scene to start writing.</p>
        </section>
      )}

      <aside className="writer-export">
        <header>
          <span className="eyebrow">Export</span>
          <h2>Markdown Preview</h2>
        </header>
        <textarea
          aria-label="Markdown Export"
          value={markdownExport}
          readOnly
          placeholder="Click Export Markdown to stage the current project script."
        />
      </aside>
    </section>
  );
}
