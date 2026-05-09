import { Eye, EyeOff } from "lucide-react";
import { useProjectStore } from "../../app/useProjectStore.js";

export function WritersRoomPanel() {
  const personas = useProjectStore((state) => state.project.personas);
  const togglePersona = useProjectStore((state) => state.togglePersona);

  return (
    <section className="writers-panel">
      <header>
        <h2>Writers Room</h2>
        <span>{personas.filter((persona) => persona.visible).length} visible</span>
      </header>
      {personas.length === 0 ? (
        <p className="muted">No writers imported yet.</p>
      ) : (
        personas.map((persona) => (
          <button
            key={persona.id}
            className={`writer-layer ${persona.visible ? "visible" : "hidden"}`}
            onClick={() => void togglePersona(persona.id)}
          >
            <span className="avatar small">{persona.name.slice(0, 2).toUpperCase()}</span>
            <span className="writer-meta">
              <strong>{persona.name}</strong>
              <small>{persona.specialty}</small>
            </span>
            {persona.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        ))
      )}
    </section>
  );
}
