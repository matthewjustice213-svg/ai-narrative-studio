import { MessageSquareText, Sparkles } from "lucide-react";
import { useProjectStore } from "../../app/useProjectStore.js";

export function AiDock() {
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const loadingAi = useProjectStore((state) => state.loadingAi);
  const error = useProjectStore((state) => state.error);
  const aiErrors = useProjectStore((state) => state.aiErrors);
  const runWritersRoom = useProjectStore((state) => state.runWritersRoom);

  const notes = selection?.type === "scene" ? project.aiNotes.filter((note) => note.sceneId === selection.id) : [];

  return (
    <section className="ai-dock">
      <header>
        <h2>AI Dock</h2>
        <span>{project.personas.filter((persona) => persona.visible).length} writers visible</span>
      </header>
      <div className="ai-actions">
        <button onClick={() => void runWritersRoom("scene_notes")} disabled={loadingAi}>
          <MessageSquareText size={16} />
          Scene Notes
        </button>
        <button onClick={() => void runWritersRoom("punch_up")} disabled={loadingAi}>
          <Sparkles size={16} />
          Punch-Up
        </button>
      </div>
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
      </div>
    </section>
  );
}
