import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export class Logger {
  private logDir: string;
  private logFile: string;

  constructor(customDir?: string) {
    const appData = process.env.APPDATA || (process.platform === "win32"
      ? path.join(os.homedir(), "AppData", "Roaming")
      : path.join(os.homedir(), ".config"));

    this.logDir = customDir || path.join(appData, "Antigravity Project Launcher", "logs");
    this.logFile = path.join(this.logDir, "app.log");
  }

  private ensureDir(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch {
      // Ignore logging setup failures
    }
  }

  private write(level: string, message: string, meta?: unknown): void {
    try {
      this.ensureDir();
      const timestamp = new Date().toISOString();
      const metaStr = meta !== undefined ? ` | ${typeof meta === "object" ? JSON.stringify(meta) : String(meta)}` : "";
      const line = `[${timestamp}] [${level}] ${message}${metaStr}\n`;
      fs.appendFileSync(this.logFile, line, "utf8");
    } catch {
      // Non-blocking
    }
  }

  public info(message: string, meta?: unknown): void {
    this.write("INFO", message, meta);
  }

  public warn(message: string, meta?: unknown): void {
    this.write("WARN", message, meta);
  }

  public error(message: string, meta?: unknown): void {
    this.write("ERROR", message, meta);
  }

  public getLogFilePath(): string {
    return this.logFile;
  }
}

export const logger = new Logger();
