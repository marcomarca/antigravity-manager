import type { Config, ImportMarkdownRequest, Project } from "../domain/types";

export interface IAppApi {
  projects: {
    list: () => Promise<Project[]>;
    open: (path: string) => Promise<void>;
    create: (name: string) => Promise<Project>;
    importMarkdown: (req: ImportMarkdownRequest) => Promise<Project>;
    setNote: (path: string, note: string) => Promise<void>;
    setDescription: (path: string, description: string) => Promise<void>;
    setPinned: (path: string, pinned: boolean) => Promise<void>;
    setTags: (path: string, tags: string[]) => Promise<void>;
    openFolder: (path: string) => Promise<void>;
    copyPath: (path: string) => Promise<void>;
  };
  planning: {
    start: () => Promise<{ pasted: boolean; promptCopied: boolean }>;
    getDefaultPrompt: () => Promise<string>;
  };
  settings: {
    get: () => Promise<Config>;
    update: (patch: Partial<Config>) => Promise<Config>;
  };
  window: {
    hide: () => Promise<void>;
    close: () => Promise<void>;
    setModalOpen?: (isOpen: boolean) => void;
    onShown: (callback: () => void) => () => void;
  };
  tray: {
    onNewProject: (callback: () => void) => () => void;
    onSettings: (callback: () => void) => () => void;
  };
  utils: {
    getPathForFile: (file: File) => string;
  };
  updater: {
    checkForUpdates: () => Promise<{ success: boolean; message?: string }>;
    quitAndInstall: () => Promise<void>;
    getStatus: () => Promise<{ state: string; version?: string; percent?: number; message?: string }>;
    getVersion: () => Promise<string>;
    onStatusChange: (callback: (status: { state: string; version?: string; percent?: number; message?: string }) => void) => () => void;
  };
}

declare global {
  interface Window {
    app: IAppApi;
  }
}
