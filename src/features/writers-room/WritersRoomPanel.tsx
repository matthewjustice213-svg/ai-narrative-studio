import { Eye, EyeOff, Image } from "lucide-react";
import { useProjectStore } from "../../app/useProjectStore.js";

export function WritersRoomPanel() {
  const personas = useProjectStore((state) => state.project.personas);
  const togglePersona = useProjectStore((state) => state.togglePersona);
  const selectPersonaAvatarWithDialog = useProjectStore((state) => state.selectPersonaAvatarWithDialog);

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
          <article key={persona.id} className={`writer-layer ${persona.visible ? "visible" : "hidden"}`}>
            <span className="avatar small">
              {persona.avatarPath ? <img src={persona.avatarPath} alt="" /> : persona.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="writer-meta">
              <strong>{persona.name}</strong>
              <small>{persona.specialty}</small>
            </span>
            <span className="layer-actions">
              <button title="Choose avatar" onClick={() => void selectPersonaAvatarWithDialog(persona.id)}>
                <Image size={15} />
              </button>
              <button title={persona.visible ? "Hide writer" : "Show writer"} onClick={() => void togglePersona(persona.id)}>
                {persona.visible ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </span>
          </article>
        ))
      )}
    </section>
  );
}
