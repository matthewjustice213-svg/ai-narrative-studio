import { useState } from "react";
import { KeyRound, MessageSquareText, Sparkles } from "lucide-react";
import { useProjectStore } from "../../app/useProjectStore.js";

export function AiDock() {
  const [apiKey, setApiKey] = useState("");
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const loadingAi = useProjectStore((state) => state.loadingAi);
  const error = useProjectStore((state) => state.error);
  const aiErrors = useProjectStore((state) => state.aiErrors);
  const runWritersRoom = useProjectStore((state) => state.runWritersRoom);
  const saveOpenAiKey = useProjectStore((state) => state.saveOpenAiKey);

  const notes = selection?.type === "scene" ? project.aiNotes.filter((note) => note.sceneId === selection.id) : [];
  const selectedScene = selection?.type === "scene" ? project.scenes.find((scene) => scene.id === selection.id) : null;
  const visibleWriters = project.personas.filter((persona) => persona.visible).length;
  const canAskWriters = Boolean(selectedScene) && visibleWriters > 0 && !loadingAi;

  return (
    <section className="ai-dock">
      <header>
        <h2>AI Dock</h2>
        <span>{visibleWriters} writers visible</span>
      </header>
      <form
        className="key-form"
        onSubmit={(event) => {
          event.preventDefault();
          void saveOpenAiKey(apiKey);
          setApiKey("");
        }}
      >
        <input
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          aria-label="OpenAI API key"
          placeholder="OpenAI API key"
        />
        <button type="submit" title="Save OpenAI API key" disabled={!apiKey.trim()}>
          <KeyRound size={16} />
        </button>
      </form>
      <div className="ai-actions">
        <button onClick={() => void runWritersRoom("scene_notes")} disabled={!canAskWriters}>
          <MessageSquareText size={16} />
          Scene Notes
        </button>
        <button onClick={() => void runWritersRoom("punch_up")} disabled={!canAskWriters}>
          <Sparkles size={16} />
          Punch-Up
        </button>
      </div>
      {loadingAi ? <p className="ai-status">Asking the visible writers room...</p> : null}
      {!selectedScene ? <p className="muted">Select a scene before asking for notes.</p> : null}
      {selectedScene && visibleWriters === 0 ? <p className="muted">Show at least one writer to run the room.</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {aiErrors.map((item) => (
        <article key={item.personaId} className="ai-note error-card">
          <strong>{item.personaName}</strong>
          <small>Request failed</small>
          <p>{item.message}</p>
        </article>
      ))}
      <div className="ai-notes">
        {notes.map((note) => {
          const persona = project.personas.find((item) => item.id === note.personaId);
          return (
            <article key={note.id} className="ai-note">
              <strong>{persona?.name || note.personaId}</strong>
              <small>{note.task}</small>
              <p>{note.response}</p>
            </article>
          );
        })}
        {selectedScene && !loadingAi && notes.length === 0 ? (
          <article className="ai-note empty-state">
            <strong>{selectedScene.title}</strong>
            <small>No AI notes yet</small>
            <p>Run Scene Notes or Punch-Up to collect responses from the visible writers.</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}
