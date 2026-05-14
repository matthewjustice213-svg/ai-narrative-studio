import { useEffect, useMemo, useState } from "react";
import { Camera, Image as ImageIcon, StickyNote, Trash2 } from "lucide-react";
import { useProjectStore } from "../../app/useProjectStore.js";

function parseTags(tagsText: string) {
  return tagsText
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function CaptureWorkspace() {
  const project = useProjectStore((state) => state.project);
  const importReferenceWithDialog = useProjectStore((state) => state.importReferenceWithDialog);
  const createReferenceNote = useProjectStore((state) => state.createReferenceNote);
  const updateReference = useProjectStore((state) => state.updateReference);
  const deleteReference = useProjectStore((state) => state.deleteReference);
  const [activeReferenceId, setActiveReferenceId] = useState<string | null>(project.references[0]?.id ?? null);
  const activeReference = useMemo(
    () => project.references.find((reference) => reference.id === activeReferenceId) ?? project.references[0] ?? null,
    [activeReferenceId, project.references]
  );
  const [draft, setDraft] = useState({
    title: activeReference?.title ?? "",
    notes: activeReference?.notes ?? "",
    tagsText: activeReference?.tags.join(", ") ?? ""
  });

  useEffect(() => {
    if (!activeReference && project.references[0]) {
      setActiveReferenceId(project.references[0].id);
    }
  }, [activeReference, project.references]);

  useEffect(() => {
    setDraft({
      title: activeReference?.title ?? "",
      notes: activeReference?.notes ?? "",
      tagsText: activeReference?.tags.join(", ") ?? ""
    });
  }, [activeReference]);

  const saveDraft = () => {
    if (!activeReference) return;
    void updateReference(activeReference.id, {
      title: draft.title.trim() || "Untitled Reference",
      notes: draft.notes,
      tags: parseTags(draft.tagsText)
    });
  };

  return (
    <section className="capture-workspace" aria-label="BB Capture workspace">
      <aside className="capture-library">
        <header>
          <div>
            <span className="eyebrow">BB Capture</span>
            <h2>Reference Library</h2>
          </div>
        </header>
        <div className="capture-actions">
          <button className="icon-button text-button" onClick={() => void importReferenceWithDialog()}>
            <ImageIcon size={14} />
            Import Image
          </button>
          <button className="icon-button text-button" onClick={() => void createReferenceNote()}>
            <StickyNote size={14} />
            New Note
          </button>
        </div>
        <div>
          {project.references.length > 0 ? (
            project.references.map((reference) => (
              <button
                key={reference.id}
                className={activeReference?.id === reference.id ? "list-row active" : "list-row"}
                onClick={() => setActiveReferenceId(reference.id)}
              >
                <span>{reference.title}</span>
                <small>{reference.kind}</small>
              </button>
            ))
          ) : (
            <p className="muted">Import a reference image or add a note.</p>
          )}
        </div>
      </aside>

      <section className="capture-editor">
        <header className="capture-header">
          <div>
            <span className="eyebrow">Reference Detail</span>
            <h2>{activeReference?.title ?? "No reference selected"}</h2>
          </div>
          {activeReference ? (
            <button className="icon-button" title="Delete reference" onClick={() => void deleteReference(activeReference.id)}>
              <Trash2 size={15} />
            </button>
          ) : null}
        </header>

        {activeReference ? (
          <div className="capture-fields">
            <label className="capture-field">
              Reference Title
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                onBlur={saveDraft}
              />
            </label>
            <label className="capture-field">
              Tags
              <input
                value={draft.tagsText}
                onChange={(event) => setDraft({ ...draft, tagsText: event.target.value })}
                onBlur={saveDraft}
              />
            </label>
            <label className="capture-field full">
              Reference Notes
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                onBlur={saveDraft}
              />
            </label>
          </div>
        ) : (
          <div className="capture-empty">
            <Camera size={28} />
            <p className="muted">Capture images, screenshots, and field notes for the project.</p>
          </div>
        )}
      </section>

      <aside className="capture-preview">
        <span className="eyebrow">Capture Board</span>
        <h2>Capture Preview</h2>
        {activeReference?.imagePath ? (
          <img src={activeReference.imagePath} alt={activeReference.title} />
        ) : (
          <div className="capture-preview-empty">
            <Camera size={28} />
            <p>{activeReference ? "This reference is a note." : "No reference selected."}</p>
          </div>
        )}
        {activeReference?.tags.length ? (
          <div className="capture-chip-row">
            {activeReference.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </aside>
    </section>
  );
}
