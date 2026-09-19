import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ProjectMetadata, StateData } from "../domain/types";
import { canonicalPathKey } from "../domain/canonical-path";
import { logger } from "../adapters/logger";
import { AppError } from "../domain/errors";

export class MetadataService {
  private statePath: string;
  private state: StateData;

  constructor(customAppDataDir?: string) {
    const appData = customAppDataDir || process.env.APPDATA || (process.platform === "win32"
      ? path.join(os.homedir(), "AppData", "Roaming")
      : path.join(os.homedir(), ".config"));

    const configDir = path.join(appData, "Antigravity Project Launcher");
    this.statePath = path.join(configDir, "state.json");

    this.state = {
      version: 1,
      projects: {}
    };
  }

  public async init(): Promise<void> {
    try {
      if (fs.existsSync(this.statePath)) {
        const raw = await fs.promises.readFile(this.statePath, "utf8");
        const parsed = JSON.parse(raw);
        this.state = {
          version: 1,
          projects: parsed.projects || {}
        };
      }
    } catch (err) {
      logger.error("Failed to read state.json, initializing empty state", err);
      this.state = { version: 1, projects: {} };
    }
  }

  public get(projectPath: string): ProjectMetadata {
    const key = canonicalPathKey(projectPath);
    return this.state.projects[key] || {};
  }

  public getNote(projectPath: string): string | undefined {
    return this.get(projectPath).note;
  }

  public async setNote(projectPath: string, note: string): Promise<void> {
    const key = canonicalPathKey(projectPath);
    const trimmed = note.trim();
    const existing = this.state.projects[key] || {};

    if (trimmed.length === 0) {
      delete existing.note;
    } else {
      existing.note = trimmed;
    }

    if (!existing.note && !existing.description) {
      delete this.state.projects[key];
    } else {
      this.state.projects[key] = existing;
    }

    await this.save();
  }

  public getDescription(projectPath: string): string | undefined {
    return this.get(projectPath).description;
  }

  public async setDescription(projectPath: string, description: string): Promise<void> {
    const key = canonicalPathKey(projectPath);
    const trimmed = description.trim();
    const existing = this.state.projects[key] || {};

    if (trimmed.length === 0) {
      delete existing.description;
    } else {
      existing.description = trimmed;
    }

    if (!existing.note && !existing.description) {
      delete this.state.projects[key];
    } else {
      this.state.projects[key] = existing;
    }

    await this.save();
  }

  public getAll(): Record<string, ProjectMetadata> {
    return { ...this.state.projects };
  }

  private async save(): Promise<void> {
    try {
      const dir = path.dirname(this.statePath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }

      const tempFile = `${this.statePath}.tmp`;
      const serialized = JSON.stringify(this.state, null, 2);

      await fs.promises.writeFile(tempFile, serialized, "utf8");
      await fs.promises.rename(tempFile, this.statePath);
    } catch (err) {
      logger.error("Failed to write state.json atomically", err);
      throw new AppError("STATE_WRITE_FAILED", "Could not save project metadata.", true, err);
    }
  }

  public getStatePath(): string {
    return this.statePath;
  }
}
