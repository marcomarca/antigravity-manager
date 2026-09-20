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
    setDescription: (path: string, description: string): Promise<void> => ipcRenderer.invoke("projects:setDescription", path, description),
    setPinned: (path: string, pinned: boolean): Promise<void> => ipcRenderer.invoke("projects:setPinned", path, pinned),
    setTags: (path: string, tags: string[]): Promise<void> => ipcRenderer.invoke("projects:setTags", path, tags),
    openFolder: (path: string): Promise<void> => ipcRenderer.invoke("projects:openFolder", path),
    copyPath: (path: string): Promise<void> => ipcRenderer.invoke("projects:copyPath", path)
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
  },
  updater: {
    checkForUpdates: (): Promise<{ success: boolean; message?: string }> => ipcRenderer.invoke("updater:check"),
    quitAndInstall: (): Promise<void> => ipcRenderer.invoke("updater:quitAndInstall"),
    getStatus: (): Promise<any> => ipcRenderer.invoke("updater:getStatus"),
    getVersion: (): Promise<string> => ipcRenderer.invoke("updater:getVersion"),
    onStatusChange: (callback: (status: any) => void): (() => void) => {
      const handler = (_event: any, status: any) => callback(status);
      ipcRenderer.on("updater:statusChanged", handler);
      return () => {
        ipcRenderer.removeListener("updater:statusChanged", handler);
      };
    }
  }
};

contextBridge.exposeInMainWorld("app", api);
