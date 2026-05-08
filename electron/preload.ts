import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("narrativeStudio", {
  version: "0.1.0"
});
