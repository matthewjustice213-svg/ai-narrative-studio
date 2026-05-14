import { useEffect, useState } from "react";
import { useProjectStore } from "../../app/useProjectStore.js";
import type { ProjectPitch } from "../../lib/schema.js";

type PitchDraft = Omit<ProjectPitch, "comps"> & {
  compsText: string;
};

function toDraft(pitch: ProjectPitch): PitchDraft {
  return {
    logline: pitch.logline,
    synopsis: pitch.synopsis,
    tone: pitch.tone,
    audience: pitch.audience,
    compsText: pitch.comps.join("\n"),
    oneSheetNotes: pitch.oneSheetNotes
  };
}

function parseComps(compsText: string) {
  return compsText
    .split("\n")
    .map((comp) => comp.trim())
    .filter(Boolean);
}

export function PitchWorkspace() {
  const project = useProjectStore((state) => state.project);
  const updatePitch = useProjectStore((state) => state.updatePitch);
  const [draft, setDraft] = useState<PitchDraft>(() => toDraft(project.pitch));

  useEffect(() => {
    setDraft(toDraft(project.pitch));
  }, [project.pitch]);

  const saveDraft = (nextDraft = draft) => {
    void updatePitch({
      logline: nextDraft.logline,
      synopsis: nextDraft.synopsis,
      tone: nextDraft.tone,
      audience: nextDraft.audience,
      comps: parseComps(nextDraft.compsText),
      oneSheetNotes: nextDraft.oneSheetNotes
    });
  };

  const comps = parseComps(draft.compsText);

  return (
    <section className="pitch-workspace" aria-label="BB Pitch workspace">
      <aside className="pitch-brief">
        <span className="eyebrow">BB Pitch</span>
        <h2>Pitch Room</h2>
        <section>
          <h3>Story Package</h3>
          <p>{project.scenes.length} scenes</p>
          <p>{project.characters.length} characters</p>
          <p>{project.storyBeats.length} beats</p>
        </section>
        <section>
          <h3>Comparable Titles</h3>
          {comps.length > 0 ? comps.map((comp) => <p key={comp}>{comp}</p>) : <p>No comps yet.</p>}
        </section>
      </aside>

      <section className="pitch-editor">
        <header className="pitch-header">
          <div>
            <span className="eyebrow">One-Sheet Builder</span>
            <h2>{project.title}</h2>
          </div>
        </header>

        <div className="pitch-fields">
          <label className="pitch-field full">
            Logline
            <textarea
              value={draft.logline}
              onChange={(event) => setDraft({ ...draft, logline: event.target.value })}
              onBlur={() => saveDraft()}
            />
          </label>
          <label className="pitch-field full">
            Synopsis
            <textarea
              value={draft.synopsis}
              onChange={(event) => setDraft({ ...draft, synopsis: event.target.value })}
              onBlur={() => saveDraft()}
            />
          </label>
          <label className="pitch-field">
            Tone
            <textarea
              value={draft.tone}
              onChange={(event) => setDraft({ ...draft, tone: event.target.value })}
              onBlur={() => saveDraft()}
            />
          </label>
          <label className="pitch-field">
            Target Audience
            <textarea
              value={draft.audience}
              onChange={(event) => setDraft({ ...draft, audience: event.target.value })}
              onBlur={() => saveDraft()}
            />
          </label>
          <label className="pitch-field">
            Comparable Titles
            <textarea
              value={draft.compsText}
              onChange={(event) => setDraft({ ...draft, compsText: event.target.value })}
              onBlur={() => saveDraft()}
            />
          </label>
          <label className="pitch-field">
            One-Sheet Notes
            <textarea
              value={draft.oneSheetNotes}
              onChange={(event) => setDraft({ ...draft, oneSheetNotes: event.target.value })}
              onBlur={() => saveDraft()}
            />
          </label>
        </div>
      </section>

      <aside className="pitch-preview">
        <span className="eyebrow">Pitch Output</span>
        <h2>One-Sheet Preview</h2>
        <article>
          <h3>{project.title}</h3>
          <strong>{draft.logline || "Add a logline to define the promise."}</strong>
          <p>{draft.synopsis || "Add a short synopsis to frame the story engine."}</p>
          <div className="pitch-chip-row">
            <span>{draft.tone || "Tone TBD"}</span>
            <span>{draft.audience || "Audience TBD"}</span>
          </div>
          <footer>{comps.length > 0 ? comps.join(" / ") : "Comps TBD"}</footer>
        </article>
      </aside>
    </section>
  );
}
