import { contextBridge, ipcRenderer } from "electron";
import type { NarrativeStudioApi } from "../src/lib/electronApi.js";

const narrativeStudio: NarrativeStudioApi = {
  createProjectWithDialog() {
    return ipcRenderer.invoke("project:create-dialog");
  },
  openProjectWithDialog() {
    return ipcRenderer.invoke("project:open-dialog");
  },
  saveProject(project) {
    return ipcRenderer.invoke("project:save", project);
  },
  updateScene(sceneId, patch) {
    return ipcRenderer.invoke("scene:update", sceneId, patch);
  },
  updateCharacter(characterId, patch) {
    return ipcRenderer.invoke("character:update", characterId, patch);
  },
  replaceEdges(edges) {
    return ipcRenderer.invoke("edges:replace", edges);
  },
  importSoulWithDialog() {
    return ipcRenderer.invoke("persona:import-dialog");
  },
  selectPersonaAvatarWithDialog(personaId) {
    return ipcRenderer.invoke("persona:select-avatar-dialog", personaId);
  },
  updatePersona(personaId, patch) {
    return ipcRenderer.invoke("persona:update", personaId, patch);
  },
  runWritersRoom(sceneId, task) {
    return ipcRenderer.invoke("writers-room:run", sceneId, task);
  },
  setOpenAiKey(apiKey) {
    return ipcRenderer.invoke("settings:set-openai-key", apiKey);
  },
  hasOpenAiKey() {
    return ipcRenderer.invoke("settings:has-openai-key");
  }
};

contextBridge.exposeInMainWorld("narrativeStudio", narrativeStudio);
