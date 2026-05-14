import { useEffect, type CSSProperties, type PointerEvent } from "react";
import {
  BookOpen,
  Camera,
  Clapperboard,
  Film,
  PenLine,
  Presentation,
  Users,
  type LucideIcon
} from "lucide-react";
import { studioModules, type StudioModule, type StudioModuleId } from "./app/studioModules.js";
import { useProjectStore } from "./app/useProjectStore.js";
import { AiDock } from "./features/ai-dock/AiDock.js";
import { StoryCanvas } from "./features/canvas/StoryCanvas.js";
import { CharacterWorkspace } from "./features/characters/CharacterWorkspace.js";
import { DirectorWorkspace } from "./features/director/DirectorWorkspace.js";
import { InspectorPanel } from "./features/inspector/InspectorPanel.js";
import { ProjectPanel } from "./features/project/ProjectPanel.js";
import { BeatBoard } from "./features/story/BeatBoard.js";
import { WriterWorkspace } from "./features/writer/WriterWorkspace.js";
import { WritersRoomPanel } from "./features/writers-room/WritersRoomPanel.js";

const moduleIcons: Record<StudioModuleId, LucideIcon> = {
  story: BookOpen,
  writer: PenLine,
  characters: Users,
  director: Clapperboard,
  pitch: Presentation,
  animate: Film,
  capture: Camera
};

export default function App() {
  const loadDefaultProject = useProjectStore((state) => state.loadDefaultProject);
  const project = useProjectStore((state) => state.project);
  const activeModuleId = useProjectStore((state) => state.activeModuleId);
  const storyView = useProjectStore((state) => state.storyView);
  const layout = useProjectStore((state) => state.layout);
  const setActiveModule = useProjectStore((state) => state.setActiveModule);
  const setStoryView = useProjectStore((state) => state.setStoryView);
  const updateLayout = useProjectStore((state) => state.updateLayout);
  const resetLayout = useProjectStore((state) => state.resetLayout);
  const activeModule = studioModules.find((module) => module.id === activeModuleId) ?? studioModules[0];
  const isStoryModule = activeModule.id === "story";
  const isStoryCanvas = isStoryModule && storyView === "canvas";
  const shellStyle = {
    "--project-panel-width": `${layout.projectPanelWidth}px`,
    "--right-panel-width": `${layout.rightPanelWidth}px`,
    "--inspector-panel-height": `${layout.inspectorHeight}px`,
    "--writers-panel-height": `${layout.writersHeight}px`
  } as CSSProperties;

  const startHorizontalResize =
    (key: "projectPanelWidth" | "rightPanelWidth") => (event: PointerEvent<HTMLDivElement>) => {
      const startX = event.clientX;
      const startValue = layout[key];
      const direction = key === "projectPanelWidth" ? 1 : -1;

      const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
        updateLayout({ [key]: startValue + (moveEvent.clientX - startX) * direction });
      };
      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    };

  const startVerticalResize = (key: "inspectorHeight" | "writersHeight") => (event: PointerEvent<HTMLDivElement>) => {
    const startY = event.clientY;
    const startValue = layout[key];

    const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
      updateLayout({ [key]: startValue + moveEvent.clientY - startY });
    };
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  useEffect(() => {
    if (!window.narrativeStudio?.loadDefaultProject) return;
    void loadDefaultProject();
  }, [loadDefaultProject]);

  return (
    <main className="studio-shell" style={shellStyle}>
      <header className="studio-topbar">
        <div className="studio-brand">
          <span className="brand-mark">BB</span>
          <div>
            <span className="eyebrow">Cinematic story OS</span>
            <h1>BB Studio</h1>
          </div>
        </div>
        <div className="project-heading">
          <span className="eyebrow">Open project</span>
          <strong>{project.title}</strong>
        </div>
        <nav className="module-tabs" aria-label="BB Studio modules">
          {studioModules.map((module) => (
            <button
              key={module.id}
              className={module.id === activeModule.id ? "active" : ""}
              aria-pressed={module.id === activeModule.id}
              onClick={() => setActiveModule(module.id)}
            >
              {module.name}
            </button>
          ))}
        </nav>
        <button className="layout-reset-button" onClick={resetLayout}>
          Reset Layout
        </button>
      </header>
      <nav className="activity-rail" aria-label="Module sidebar">
        {studioModules.map((module) => {
          const Icon = moduleIcons[module.id];

          return (
            <button
              key={module.id}
              className={module.id === activeModule.id ? "rail-button active" : "rail-button"}
              aria-pressed={module.id === activeModule.id}
              onClick={() => setActiveModule(module.id)}
              title={module.name}
            >
              <Icon size={18} />
              <span>{module.shortName}</span>
            </button>
          );
        })}
      </nav>
      <ProjectPanel />
      <div
        className="resize-handle vertical project-resize-handle"
        role="separator"
        aria-label="Resize project sidebar"
        aria-orientation="vertical"
        onPointerDown={startHorizontalResize("projectPanelWidth")}
      />
      <section className={isStoryCanvas ? "module-workspace" : "module-workspace expanded"}>
        {isStoryCanvas ? (
          <StoryCanvas />
        ) : isStoryModule ? (
          <BeatBoard />
        ) : activeModule.id === "writer" ? (
          <WriterWorkspace />
        ) : activeModule.id === "characters" ? (
          <CharacterWorkspace />
        ) : activeModule.id === "director" ? (
          <DirectorWorkspace />
        ) : (
          <ModulePlaceholder module={activeModule} />
        )}
      </section>
      {isStoryCanvas ? (
        <>
          <div
            className="resize-handle vertical right-resize-handle"
            role="separator"
            aria-label="Resize right dock"
            aria-orientation="vertical"
            onPointerDown={startHorizontalResize("rightPanelWidth")}
          />
          <section className="right-stack">
            <InspectorPanel />
            <div
              className="resize-handle horizontal"
              role="separator"
              aria-label="Resize inspector panel"
              aria-orientation="horizontal"
              onPointerDown={startVerticalResize("inspectorHeight")}
            />
            <WritersRoomPanel />
            <div
              className="resize-handle horizontal"
              role="separator"
              aria-label="Resize writers room panel"
              aria-orientation="horizontal"
              onPointerDown={startVerticalResize("writersHeight")}
            />
            <AiDock />
          </section>
        </>
      ) : null}
      <nav className="bottom-tabs" aria-label="Workspace modes">
        <button className={isStoryCanvas ? "active" : ""} aria-pressed={isStoryCanvas} onClick={() => setStoryView("canvas")}>
          Canvas
        </button>
        <button
          className={isStoryModule && storyView === "beats" ? "active" : ""}
          aria-pressed={isStoryModule && storyView === "beats"}
          onClick={() => setStoryView("beats")}
        >
          Beats
        </button>
        <button disabled>Timeline</button>
        <button disabled>Screenplay</button>
        <button disabled>Analysis</button>
      </nav>
    </main>
  );
}

function ModulePlaceholder({ module }: { module: StudioModule }) {
  const Icon = moduleIcons[module.id];

  return (
    <section className="module-placeholder" aria-label={`${module.name} placeholder`}>
      <div className="placeholder-icon">
        <Icon size={28} />
      </div>
      <span className="eyebrow">{module.name}</span>
      <h2>{module.placeholderTitle}</h2>
      <p>{module.placeholderDetail}</p>
      <small>{module.summary}</small>
    </section>
  );
}
