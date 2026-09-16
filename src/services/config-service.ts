import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { Config } from "../domain/types";
import { logger } from "../adapters/logger";
import { AppError } from "../domain/errors";

export class ConfigService {
  private configPath: string;
  private currentConfig: Config;

  constructor(customAppDataDir?: string) {
    const appData = customAppDataDir || process.env.APPDATA || (process.platform === "win32"
      ? path.join(os.homedir(), "AppData", "Roaming")
      : path.join(os.homedir(), ".config"));

    const configDir = path.join(appData, "Antigravity Project Launcher");
    this.configPath = path.join(configDir, "config.json");

    const defaultProjectsRoot = fs.existsSync("D:\\apps-2026")
      ? "D:\\apps-2026"
      : path.join(os.homedir(), "Projects");

    this.currentConfig = {
      version: 1,
      projectsRoot: defaultProjectsRoot,
      hotkey: "Ctrl+Alt+Space",
      launchAtStartup: true,
      antigravityExecutable: null,
      chatgptMode: "auto"
    };
  }

  public async init(): Promise<Config> {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = await fs.promises.readFile(this.configPath, "utf8");
        const parsed = JSON.parse(raw);
        this.currentConfig = {
          ...this.currentConfig,
          ...parsed,
          version: 1
        };
      } else {
        await this.save();
      }
    } catch (err) {
      logger.error("Failed to load config.json, using defaults", err);
    }
    return this.currentConfig;
  }

  public get(): Config {
    return { ...this.currentConfig };
  }

  public async update(patch: Partial<Config>): Promise<Config> {
    this.currentConfig = {
      ...this.currentConfig,
      ...patch,
      version: 1
    };
    await this.save();
    return this.get();
  }

  private async save(): Promise<void> {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }

      const tempFile = `${this.configPath}.tmp`;
      const serialized = JSON.stringify(this.currentConfig, null, 2);

      await fs.promises.writeFile(tempFile, serialized, "utf8");
      await fs.promises.rename(tempFile, this.configPath);
    } catch (err) {
      logger.error("Failed to write config.json atomically", err);
      throw new AppError("STATE_WRITE_FAILED", "Could not save configuration.", true, err);
    }
  }

  public getConfigPath(): string {
    return this.configPath;
  }
}
