import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { storyBeatColumns } from "../../app/storyBeatColumns.js";
import { useProjectStore } from "../../app/useProjectStore.js";
import type { StoryBeat, StoryBeatColumnId } from "../../lib/schema.js";

function tagsFromInput(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function BeatBoard() {
  const project = useProjectStore((state) => state.project);
  const createStoryBeat = useProjectStore((state) => state.createStoryBeat);
  const updateStoryBeat = useProjectStore((state) => state.updateStoryBeat);
  const moveStoryBeat = useProjectStore((state) => state.moveStoryBeat);
  const reorderStoryBeat = useProjectStore((state) => state.reorderStoryBeat);
  const deleteStoryBeat = useProjectStore((state) => state.deleteStoryBeat);

  const beatsByColumn = useMemo(() => {
    const grouped = new Map<StoryBeatColumnId, StoryBeat[]>();

    for (const column of storyBeatColumns) {
      grouped.set(column.id, []);
    }

    for (const beat of project.storyBeats) {
      grouped.set(beat.columnId, [...(grouped.get(beat.columnId) ?? []), beat]);
    }

    for (const column of storyBeatColumns) {
      grouped.set(
        column.id,
        [...(grouped.get(column.id) ?? [])].sort((first, second) => first.order - second.order)
      );
    }

    return grouped;
  }, [project.storyBeats]);

  return (
    <section className="beat-board">
      <header className="beat-board-header">
        <div>
          <span className="eyebrow">BB Story</span>
          <h2>Story Beat Board</h2>
        </div>
        <button className="icon-button text-button" onClick={() => void createStoryBeat()}>
          <Plus size={16} />
          New Beat
        </button>
      </header>

      <div className="beat-columns">
        {storyBeatColumns.map((column) => {
          const beats = beatsByColumn.get(column.id) ?? [];

          return (
            <section key={column.id} className="beat-column">
              <header>
                <h3>{column.label}</h3>
                <button className="mini-button" title={`Add beat to ${column.label}`} onClick={() => void createStoryBeat(column.id)}>
                  <Plus size={14} />
                </button>
              </header>
              <div className="beat-card-list">
                {beats.map((beat) => (
                  <article
                    key={beat.id}
                    className="beat-card"
                    style={{ "--beat-color": beat.color ?? "#38d8ff" } as CSSProperties}
                  >
                    <label>
                      Title
                      <input
                        value={beat.title}
                        onChange={(event) => void updateStoryBeat(beat.id, { title: event.target.value || "Untitled Beat" })}
                      />
                    </label>
                    <label>
                      Summary
                      <textarea
                        value={beat.summary}
                        onChange={(event) => void updateStoryBeat(beat.id, { summary: event.target.value })}
                      />
                    </label>
                    <div className="beat-card-row">
                      <label>
                        Column
                        <select value={beat.columnId} onChange={(event) => void moveStoryBeat(beat.id, event.target.value as StoryBeatColumnId)}>
                          {storyBeatColumns.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Color
                        <input
                          value={beat.color ?? ""}
                          placeholder="#38d8ff"
                          onChange={(event) => void updateStoryBeat(beat.id, { color: event.target.value.trim() || null })}
                        />
                      </label>
                    </div>
                    <label>
                      Tags
                      <input
                        value={beat.tags.join(", ")}
                        placeholder="setup, pressure"
                        onChange={(event) => void updateStoryBeat(beat.id, { tags: tagsFromInput(event.target.value) })}
                      />
                    </label>
                    <footer>
                      <button title="Move left" onClick={() => void moveStoryBeat(beat.id, previousColumn(beat.columnId))}>
                        <ArrowLeft size={14} />
                      </button>
                      <button title="Move right" onClick={() => void moveStoryBeat(beat.id, nextColumn(beat.columnId))}>
                        <ArrowRight size={14} />
                      </button>
                      <button title="Move up" onClick={() => void reorderStoryBeat(beat.id, "up")}>
                        <ArrowUp size={14} />
                      </button>
                      <button title="Move down" onClick={() => void reorderStoryBeat(beat.id, "down")}>
                        <ArrowDown size={14} />
                      </button>
                      <button className="danger-action" title="Delete beat" onClick={() => void deleteStoryBeat(beat.id)}>
                        <Trash2 size={14} />
                      </button>
                    </footer>
                  </article>
                ))}
                {beats.length === 0 ? <p className="muted">Drop new story beats here.</p> : null}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function previousColumn(columnId: StoryBeatColumnId) {
  const index = storyBeatColumns.findIndex((column) => column.id === columnId);
  return storyBeatColumns[Math.max(index - 1, 0)].id;
}

function nextColumn(columnId: StoryBeatColumnId) {
  const index = storyBeatColumns.findIndex((column) => column.id === columnId);
  return storyBeatColumns[Math.min(index + 1, storyBeatColumns.length - 1)].id;
}
