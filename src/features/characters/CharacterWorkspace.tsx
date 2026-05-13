import { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "../../app/useProjectStore.js";

type CharacterDraft = {
  name: string;
  role: string;
  bio: string;
  motivation: string;
  fear: string;
  dialogueStyle: string;
  linkedSceneIds: string[];
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CharacterWorkspace() {
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const createCharacter = useProjectStore((state) => state.createCharacter);
  const selectCharacter = useProjectStore((state) => state.selectCharacter);
  const updateCharacter = useProjectStore((state) => state.updateCharacter);
  const selectCharacterAvatarWithDialog = useProjectStore((state) => state.selectCharacterAvatarWithDialog);
  const activeCharacter = useMemo(() => {
    if (selection?.type === "character") {
      return project.characters.find((character) => character.id === selection.id) ?? project.characters[0] ?? null;
    }

    return project.characters[0] ?? null;
  }, [project.characters, selection]);
  const [draft, setDraft] = useState<CharacterDraft | null>(null);

  useEffect(() => {
    if (!activeCharacter) {
      setDraft(null);
      return;
    }

    setDraft({
      name: activeCharacter.name,
      role: activeCharacter.role,
      bio: activeCharacter.bio,
      motivation: activeCharacter.motivation,
      fear: activeCharacter.fear,
      dialogueStyle: activeCharacter.dialogueStyle,
      linkedSceneIds: activeCharacter.linkedSceneIds
    });
  }, [activeCharacter]);

  const saveDraft = (nextDraft = draft) => {
    if (!activeCharacter || !nextDraft) return;

    void updateCharacter(activeCharacter.id, {
      name: nextDraft.name.trim() || "Unnamed Character",
      role: nextDraft.role,
      bio: nextDraft.bio,
      motivation: nextDraft.motivation,
      fear: nextDraft.fear,
      dialogueStyle: nextDraft.dialogueStyle,
      linkedSceneIds: nextDraft.linkedSceneIds
    });
  };

  const updateSceneLink = (sceneId: string, linked: boolean) => {
    if (!draft) return;

    const linkedSceneIds = linked
      ? Array.from(new Set([...draft.linkedSceneIds, sceneId]))
      : draft.linkedSceneIds.filter((id) => id !== sceneId);
    const nextDraft = { ...draft, linkedSceneIds };
    setDraft(nextDraft);
    saveDraft(nextDraft);
  };

  return (
    <section className="characters-workspace" aria-label="BB Characters workspace">
      <aside className="character-roster">
        <header>
          <div>
            <span className="eyebrow">BB Characters</span>
            <h2>Roster</h2>
          </div>
          <button className="icon-button text-button" onClick={() => void createCharacter()}>
            New Character
          </button>
        </header>
        <div>
          {project.characters.map((character) => (
            <button
              key={character.id}
              className={activeCharacter?.id === character.id ? "character-row active" : "character-row"}
              onClick={() => selectCharacter(character.id)}
            >
              <span className="avatar small">
                {character.avatarPath ? <img src={character.avatarPath} alt="" /> : initials(character.name)}
              </span>
              <span className="writer-meta">
                <strong>{character.name}</strong>
                <small>{character.role}</small>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {activeCharacter && draft ? (
        <>
          <section className="character-profile">
            <header className="character-profile-header">
              <span className="avatar character-avatar">
                {activeCharacter.avatarPath ? <img src={activeCharacter.avatarPath} alt="" /> : initials(draft.name)}
              </span>
              <div>
                <span className="eyebrow">Character Bible</span>
                <h2>{draft.name}</h2>
                <p>{draft.role || "Role"}</p>
              </div>
              <button className="icon-button text-button" onClick={() => void selectCharacterAvatarWithDialog(activeCharacter.id)}>
                Choose Avatar
              </button>
            </header>

            <div className="character-fields">
              <label className="character-field">
                Name
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
              <label className="character-field">
                Role
                <input
                  value={draft.role}
                  onChange={(event) => setDraft({ ...draft, role: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
              <label className="character-field full">
                Bio
                <textarea
                  value={draft.bio}
                  onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
              <label className="character-field">
                Motivation
                <textarea
                  value={draft.motivation}
                  onChange={(event) => setDraft({ ...draft, motivation: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
              <label className="character-field">
                Fear
                <textarea
                  value={draft.fear}
                  onChange={(event) => setDraft({ ...draft, fear: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
              <label className="character-field full">
                Dialogue Style
                <textarea
                  value={draft.dialogueStyle}
                  onChange={(event) => setDraft({ ...draft, dialogueStyle: event.target.value })}
                  onBlur={() => saveDraft()}
                />
              </label>
            </div>
          </section>

          <aside className="character-links">
            <header>
              <span className="eyebrow">Continuity</span>
              <h2>Linked Scenes</h2>
            </header>
            <div className="scene-link-list">
              {project.scenes.map((scene) => (
                <label key={scene.id} className="scene-link-row">
                  <input
                    type="checkbox"
                    aria-label={scene.title}
                    checked={draft.linkedSceneIds.includes(scene.id)}
                    onChange={(event) => updateSceneLink(scene.id, event.target.checked)}
                  />
                  <span>
                    <strong>{scene.title}</strong>
                    <small>{scene.runtimeEstimate} min</small>
                  </span>
                </label>
              ))}
            </div>
            <section className="character-snapshot">
              <h2>Arc Snapshot</h2>
              <p>{draft.motivation || "No motivation entered yet."}</p>
              <p>{draft.fear || "No fear entered yet."}</p>
            </section>
          </aside>
        </>
      ) : (
        <section className="character-empty">
          <h2>Character Bible</h2>
          <p className="muted">Create a character to start the cast bible.</p>
        </section>
      )}
    </section>
  );
}
