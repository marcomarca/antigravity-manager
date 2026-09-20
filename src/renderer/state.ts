import type { Config, ImportMarkdownRequest, Project, SortMode } from "../domain/types";

export type ModalType = "none" | "new_project" | "settings" | "collision";

export interface CollisionContext {
  type: "create" | "markdown";
  name: string;
  filePath?: string;
  folderExists?: boolean;
  fileExists?: boolean;
}

export interface AppState {
  projects: Project[];
  filteredProjects: Project[];
  selectedIndex: number;
  searchQuery: string;
  sortMode: SortMode;
  selectedProject: Project | null;
  selectedTags: string[];
  activeModal: ModalType;
  collisionContext: CollisionContext | null;
  config: Config | null;
}

class StateStore {
  private state: AppState = {
    projects: [],
    filteredProjects: [],
    selectedIndex: 0,
    searchQuery: "",
    sortMode: "recent",
    selectedProject: null,
    selectedTags: [],
    activeModal: "none",
    collisionContext: null,
    config: null
  };

  private listeners: Array<() => void> = [];

  public getState(): AppState {
    return this.state;
  }

  public setState(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };

    // Auto update selectedProject based on selectedIndex
    if (this.state.filteredProjects.length > 0) {
      if (this.state.selectedIndex >= this.state.filteredProjects.length) {
        this.state.selectedIndex = Math.max(0, this.state.filteredProjects.length - 1);
      }
      this.state.selectedProject = this.state.filteredProjects[this.state.selectedIndex] || null;
    } else {
      this.state.selectedProject = null;
      this.state.selectedIndex = 0;
    }

    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const store = new StateStore();
