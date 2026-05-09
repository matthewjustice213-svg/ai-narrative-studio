import { Eye, EyeOff, FilePlus2, FolderOpen, Plus, UserPlus } from "lucide-react";
import { useProjectStore } from "../../app/useProjectStore.js";

export function ProjectPanel() {
  const project = useProjectStore((state) => state.project);
  const selectScene = useProjectStore((state) => state.selectScene);
  const selectCharacter = useProjectStore((state) => state.selectCharacter);
  const selectGroupBox = useProjectStore((state) => state.selectGroupBox);
  const togglePersona = useProjectStore((state) => state.togglePersona);
  const createProjectWithDialog = useProjectStore((state) => state.createProjectWithDialog);
  const openProjectWithDialog = useProjectStore((state) => state.openProjectWithDialog);
  const importSoulWithDialog = useProjectStore((state) => state.importSoulWithDialog);
  const createScene = useProjectStore((state) => state.createScene);
  const createCharacter = useProjectStore((state) => state.createCharacter);
  const createGroupBox = useProjectStore((state) => state.createGroupBox);

  return (
    <aside className="project-panel">
      <header className="panel-header">
        <div>
          <span className="eyebrow">Project</span>
          <h1>{project.title}</h1>
        </div>
      </header>

      <div className="toolbar-row">
        <button className="icon-button" title="Create project" onClick={() => void createProjectWithDialog()}>
          <FilePlus2 size={16} />
        </button>
        <button className="icon-button" title="Open project" onClick={() => void openProjectWithDialog()}>
          <FolderOpen size={16} />
        </button>
        <button className="icon-button" title="Import soul.md" onClick={() => void importSoulWithDialog()}>
          <UserPlus size={16} />
        </button>
      </div>

      <section>
        <div className="section-heading">
          <h2>Scenes</h2>
          <button className="mini-button" title="Add scene" onClick={() => void createScene()}>
            <Plus size={14} />
          </button>
        </div>
        {project.scenes.map((scene) => (
          <button key={scene.id} className="list-row" onClick={() => selectScene(scene.id)}>
            <span>{scene.title}</span>
            <small>{scene.runtimeEstimate}m</small>
          </button>
        ))}
      </section>

      <section>
        <div className="section-heading">
          <h2>Characters</h2>
          <button className="mini-button" title="Add character" onClick={() => void createCharacter()}>
            <UserPlus size={14} />
          </button>
        </div>
        {project.characters.map((character) => (
          <button key={character.id} className="list-row" onClick={() => selectCharacter(character.id)}>
            <span>{character.name}</span>
            <small>{character.role}</small>
          </button>
        ))}
      </section>

      <section>
        <div className="section-heading">
          <h2>Boxes</h2>
          <button className="mini-button" title="Add group box" onClick={() => void createGroupBox()}>
            <Plus size={14} />
          </button>
        </div>
        {project.groupBoxes.length === 0 ? (
          <p className="muted">Right-click the canvas to create organization boxes.</p>
        ) : (
          project.groupBoxes.map((groupBox) => (
            <button key={groupBox.id} className="list-row" onClick={() => selectGroupBox(groupBox.id)}>
              <span>{groupBox.title}</span>
              <small>{Math.round(groupBox.width)}x{Math.round(groupBox.height)}</small>
            </button>
          ))
        )}
      </section>

      <section>
        <h2>Writers Room</h2>
        {project.personas.length === 0 ? (
          <p className="muted">Import a structured soul.md file to add writers.</p>
        ) : (
          project.personas.map((persona) => (
            <button key={persona.id} className="persona-row" onClick={() => void togglePersona(persona.id)}>
              <span className="avatar small">
                {persona.avatarPath ? <img src={persona.avatarPath} alt="" /> : persona.name.slice(0, 2).toUpperCase()}
              </span>
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
