export type ProjectType = "folder" | "workspace";

export type SortMode =
  | "recent"
  | "name_asc"
  | "name_desc"
  | "modified_desc"
  | "created_desc"
  | "created_asc";

export interface ProjectSource {
  antigravityRecent: boolean;
  projectsRoot: boolean;
}

export interface Project {
  path: string;
  name: string;
  type: ProjectType;
  exists: boolean;
  source: ProjectSource;
  recentIndex?: number;
  description?: string;
  note?: string;
  createdAt?: number;
  modifiedAt?: number;
  pinned?: boolean;
  tags?: string[];
}

export interface ProjectMetadata {
  description?: string;
  note?: string;
  pinned?: boolean;
  tags?: string[];
}

export interface StateData {
  version: number;
  projects: Record<string, ProjectMetadata>;
}

export type ChatGPTMode = "auto" | "desktop" | "web";

export interface Config {
  version: number;
  projectsRoot: string;
  hotkey: string;
  launchAtStartup: boolean;
  antigravityExecutable: string | null;
  chatgptMode: ChatGPTMode;
  customPlanningPrompt?: string;
  defaultSortMode?: SortMode;
  openFolderShortcut?: string;
  copyPathShortcut?: string;
  pinShortcut?: string;
}

export type AppErrorCode =
  | "PROJECT_EXISTS"
  | "INVALID_PROJECT_NAME"
  | "INVALID_MARKDOWN"
  | "PROJECT_ROOT_UNAVAILABLE"
  | "ANTIGRAVITY_NOT_FOUND"
  | "ANTIGRAVITY_LAUNCH_FAILED"
  | "CHATGPT_LAUNCH_FAILED"
  | "CHATGPT_FOCUS_FAILED"
  | "STATE_READ_FAILED"
  | "STATE_WRITE_FAILED"
  | "UNKNOWN_ERROR";

export interface AppErrorPayload {
  code: AppErrorCode;
  message: string;
  recoverable: boolean;
  details?: unknown;
}

export interface CreateProjectRequest {
  name: string;
}

export interface ImportMarkdownRequest {
  filePath: string;
  overrideCollision?: "open" | "copy_into_existing" | "replace";
}

export interface SetDescriptionRequest {
  path: string;
  description: string;
}

export interface SetNoteRequest {
  path: string;
  note: string;
}

export interface OpenProjectRequest {
  path: string;
}

export interface RecentProject {
  path: string;
  name: string;
  type: ProjectType;
  recentIndex: number;
}
