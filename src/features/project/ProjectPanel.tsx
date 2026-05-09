import { Eye, EyeOff, FilePlus2 } from "lucide-react";
import { useProjectStore } from "../../app/useProjectStore.js";

export function ProjectPanel() {
  const project = useProjectStore((state) => state.project);
  const selectScene = useProjectStore((state) => state.selectScene);
  const selectCharacter = useProjectStore((state) => state.selectCharacter);
  const togglePersona = useProjectStore((state) => state.togglePersona);

  return (
    <aside className="project-panel">
      <header className="panel-header">
        <div>
          <span className="eyebrow">Project</span>
          <h1>{project.title}</h1>
        </div>
        <button className="icon-button" title="New scene">
          <FilePlus2 size={16} />
        </button>
      </header>

      <section>
        <h2>Scenes</h2>
        {project.scenes.map((scene) => (
          <button key={scene.id} className="list-row" onClick={() => selectScene(scene.id)}>
            <span>{scene.title}</span>
            <small>{scene.runtimeEstimate}m</small>
          </button>
        ))}
      </section>

      <section>
        <h2>Characters</h2>
        {project.characters.map((character) => (
          <button key={character.id} className="list-row" onClick={() => selectCharacter(character.id)}>
            <span>{character.name}</span>
            <small>{character.role}</small>
          </button>
        ))}
      </section>

      <section>
        <h2>Writers Room</h2>
        {project.personas.length === 0 ? (
          <p className="muted">Import a structured soul.md file to add writers.</p>
        ) : (
          project.personas.map((persona) => (
            <button key={persona.id} className="persona-row" onClick={() => void togglePersona(persona.id)}>
              <span className="avatar small">{persona.name.slice(0, 2).toUpperCase()}</span>
              <span>
                <strong>{persona.name}</strong>
                <small>{persona.role}</small>
              </span>
              {persona.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          ))
        )}
      </section>
    </aside>
  );
}
