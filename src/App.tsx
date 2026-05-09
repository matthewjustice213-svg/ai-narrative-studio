import { useEffect } from "react";
import { useProjectStore } from "./app/useProjectStore.js";
import { AiDock } from "./features/ai-dock/AiDock.js";
import { StoryCanvas } from "./features/canvas/StoryCanvas.js";
import { InspectorPanel } from "./features/inspector/InspectorPanel.js";
import { ProjectPanel } from "./features/project/ProjectPanel.js";
import { WritersRoomPanel } from "./features/writers-room/WritersRoomPanel.js";

export default function App() {
  const loadDefaultProject = useProjectStore((state) => state.loadDefaultProject);

  useEffect(() => {
    if (!window.narrativeStudio?.loadDefaultProject) return;
    void loadDefaultProject();
  }, [loadDefaultProject]);

  return (
    <main className="workspace">
      <ProjectPanel />
      <StoryCanvas />
      <section className="right-stack">
        <InspectorPanel />
        <WritersRoomPanel />
        <AiDock />
      </section>
      <nav className="bottom-tabs" aria-label="Workspace modes">
        <button className="active">Canvas</button>
        <button disabled>Timeline</button>
        <button disabled>Screenplay</button>
        <button disabled>Analysis</button>
      </nav>
    </main>
  );
}
