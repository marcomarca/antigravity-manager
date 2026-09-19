import { contextBridge, ipcRenderer, webUtils } from "electron";
import type { Config, ImportMarkdownRequest, Project } from "../domain/types";
import type { IAppApi } from "./types";

const api: IAppApi = {
  projects: {
    list: (): Promise<Project[]> => ipcRenderer.invoke("projects:list"),
    open: (path: string): Promise<void> => ipcRenderer.invoke("projects:open", path),
    create: (name: string): Promise<Project> => ipcRenderer.invoke("projects:create", name),
    importMarkdown: (req: ImportMarkdownRequest): Promise<Project> => ipcRenderer.invoke("projects:importMarkdown", req),
    setNote: (path: string, note: string): Promise<void> => ipcRenderer.invoke("projects:setNote", path, note),
    setDescription: (path: string, description: string): Promise<void> => ipcRenderer.invoke("projects:setDescription", path, description)
  },
  planning: {
    start: (): Promise<{ pasted: boolean; promptCopied: boolean }> => ipcRenderer.invoke("planning:start"),
    getDefaultPrompt: (): Promise<string> => ipcRenderer.invoke("planning:getDefaultPrompt")
  },
  settings: {
    get: (): Promise<Config> => ipcRenderer.invoke("settings:get"),
    update: (patch: Partial<Config>): Promise<Config> => ipcRenderer.invoke("settings:update", patch)
  },
  window: {
    hide: (): Promise<void> => ipcRenderer.invoke("window:hide"),
    close: (): Promise<void> => ipcRenderer.invoke("window:close"),
    onShown: (callback: () => void): (() => void) => {
      const handler = () => callback();
      ipcRenderer.on("window:shown", handler);
      return () => {
        ipcRenderer.removeListener("window:shown", handler);
      };
    }
  },
  tray: {
    onNewProject: (callback: () => void): (() => void) => {
      const handler = () => callback();
      ipcRenderer.on("tray:newProject", handler);
      return () => {
        ipcRenderer.removeListener("tray:newProject", handler);
      };
    },
    onSettings: (callback: () => void): (() => void) => {
      const handler = () => callback();
      ipcRenderer.on("tray:settings", handler);
      return () => {
        ipcRenderer.removeListener("tray:settings", handler);
      };
    }
  },
  utils: {
    getPathForFile: (file: File): string => {
      try {
        if (webUtils && typeof webUtils.getPathForFile === "function") {
          return webUtils.getPathForFile(file);
        }
        // Fallback for older electron / test mock
        // @ts-ignore
        return file.path || "";
      } catch {
        return "";
      }
    }
  }
};

contextBridge.exposeInMainWorld("app", api);
