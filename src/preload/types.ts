import type { Config, ImportMarkdownRequest, Project } from "../domain/types";

export interface IAppApi {
  projects: {
    list: () => Promise<Project[]>;
    open: (path: string) => Promise<void>;
    create: (name: string) => Promise<Project>;
    importMarkdown: (req: ImportMarkdownRequest) => Promise<Project>;
    setNote: (path: string, note: string) => Promise<void>;
    setDescription: (path: string, description: string) => Promise<void>;
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
    onShown: (callback: () => void) => () => void;
  };
  tray: {
    onNewProject: (callback: () => void) => () => void;
    onSettings: (callback: () => void) => () => void;
  };
  utils: {
    getPathForFile: (file: File) => string;
  };
}

declare global {
  interface Window {
    app: IAppApi;
  }
}
