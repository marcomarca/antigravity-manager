import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import { AppError } from "../domain/errors";
import { logger } from "./logger";

export class AntigravityLocator {
  /**
   * Resolves a batch/script wrapper (e.g. .cmd or bin/ directory) to the direct GUI binary
   * if it exists in the parent directory, preventing console window popups on Windows.
   */
  public resolveBinaryIfScript(filePath: string): string {
    if (!filePath) return filePath;

    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath);
    const isScriptExt = ext === ".cmd" || ext === ".bat" || ext === "";
    const isBinDir = path.basename(dir).toLowerCase() === "bin";

    if (isScriptExt || isBinDir) {
      const candidateExeNames = [
        "Antigravity IDE.exe",
        "Antigravity.exe",
        "Code.exe",
        "Cursor.exe"
      ];

      // Check parent directory (e.g., .../Antigravity IDE/bin -> .../Antigravity IDE/Antigravity IDE.exe)
      const parentDir = isBinDir ? path.dirname(dir) : dir;
      for (const exeName of candidateExeNames) {
        const candidate = path.join(parentDir, exeName);
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }

      // Check same directory
      for (const exeName of candidateExeNames) {
        const candidate = path.join(dir, exeName);
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    }

    return filePath;
  }

  /**
   * Searches system PATH for a command using where.exe (Windows) or which (Unix).
   */
  public searchPath(commandName: string): string | null {
    const isWindows = process.platform === "win32";
    const lookupCmd = isWindows ? `where.exe "${commandName}"` : `which "${commandName}"`;

    try {
      const output = execSync(lookupCmd, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      });

      const lines = output
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      for (const line of lines) {
        const resolved = this.resolveBinaryIfScript(line);
        if (fs.existsSync(resolved)) {
          return resolved;
        }
        if (fs.existsSync(line)) {
          return line;
        }
      }
    } catch {
      // Command not found in PATH
    }

    return null;
  }

  public async locate(customPath?: string | null): Promise<string> {
    // 1. Configured custom path or command
    if (customPath && customPath.trim().length > 0) {
      const trimmed = customPath.trim();

      // Check if it's a direct file path
      if (fs.existsSync(trimmed)) {
        const resolved = this.resolveBinaryIfScript(trimmed);
        logger.info(`Using configured custom IDE executable: ${resolved}`);
        return resolved;
      }

      // Check if custom path is a command name in PATH (e.g. "antigravity-ide")
      const foundInPath = this.searchPath(trimmed);
      if (foundInPath) {
        logger.info(`Resolved custom command "${trimmed}" to: ${foundInPath}`);
        return foundInPath;
      }
    }

    const isWindows = process.platform === "win32";
    const isMac = process.platform === "darwin";

    // 2. Primary: Official Antigravity IDE standard installation paths
    const primaryCandidates: string[] = [];

    if (isWindows) {
      const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
      const programFiles = process.env.ProgramFiles || "C:\\Program Files";
      const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

      primaryCandidates.push(
        path.join(localAppData, "Programs", "Antigravity IDE", "Antigravity IDE.exe"),
        path.join(programFiles, "Antigravity IDE", "Antigravity IDE.exe"),
        path.join(programFilesX86, "Antigravity IDE", "Antigravity IDE.exe"),
        path.join(localAppData, "Programs", "Antigravity IDE", "bin", "antigravity-ide.cmd"),
        path.join(programFiles, "Antigravity IDE", "bin", "antigravity-ide.cmd"),
        path.join(localAppData, "Programs", "Antigravity", "Antigravity IDE.exe"),
        path.join(programFiles, "Antigravity", "Antigravity IDE.exe")
      );
    } else if (isMac) {
      primaryCandidates.push(
        "/Applications/Antigravity IDE.app/Contents/MacOS/Electron",
        path.join(os.homedir(), "Applications", "Antigravity IDE.app", "Contents", "MacOS", "Electron"),
        "/Applications/Antigravity IDE.app",
        "/Applications/Antigravity.app/Contents/MacOS/Electron",
        "/Applications/Antigravity.app"
      );
    } else {
      // Linux
      primaryCandidates.push(
        "/usr/bin/antigravity-ide",
        "/usr/local/bin/antigravity-ide",
        "/opt/Antigravity IDE/antigravity-ide",
        path.join(os.homedir(), ".local", "bin", "antigravity-ide")
      );
    }

    for (const candidate of primaryCandidates) {
      if (fs.existsSync(candidate)) {
        const resolved = this.resolveBinaryIfScript(candidate);
        logger.info(`Found Antigravity IDE at: ${resolved}`);
        return resolved;
      }
    }

    // 3. Search in system PATH for Antigravity IDE CLI
    const cliNames = ["antigravity-ide", "antigravity"];
    for (const cli of cliNames) {
      const found = this.searchPath(cli);
      if (found) {
        logger.info(`Found Antigravity CLI in PATH (${cli}): ${found}`);
        return found;
      }
    }

    // 4. Fallback detection for VS Code / Cursor if Antigravity IDE is not installed
    const fallbackEditors: string[] = [];

    if (isWindows) {
      const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
      const programFiles = process.env.ProgramFiles || "C:\\Program Files";
      const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

      fallbackEditors.push(
        path.join(localAppData, "Programs", "Microsoft VS Code", "Code.exe"),
        path.join(programFiles, "Microsoft VS Code", "Code.exe"),
        path.join(programFilesX86, "Microsoft VS Code", "Code.exe"),
        path.join(localAppData, "Programs", "cursor", "Cursor.exe")
      );
    } else if (isMac) {
      fallbackEditors.push(
        "/Applications/Visual Studio Code.app/Contents/MacOS/Electron",
        "/Applications/Visual Studio Code.app",
        "/Applications/Cursor.app"
      );
    } else {
      fallbackEditors.push("/usr/bin/code", "/usr/local/bin/code", "/usr/bin/cursor");
    }

    for (const candidate of fallbackEditors) {
      if (fs.existsSync(candidate)) {
        const resolved = this.resolveBinaryIfScript(candidate);
        logger.info(`Found fallback editor at: ${resolved}`);
        return resolved;
      }
    }

    // Fallback editors in PATH
    for (const cli of ["code", "cursor"]) {
      const found = this.searchPath(cli);
      if (found) {
        logger.info(`Found fallback editor in PATH (${cli}): ${found}`);
        return found;
      }
    }

    // 5. Last resort fallback: Antigravity 2.0 desktop app
    if (isWindows) {
      const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
      const programFiles = process.env.ProgramFiles || "C:\\Program Files";

      const ag2Candidates = [
        path.join(localAppData, "Programs", "Antigravity", "Antigravity.exe"),
        path.join(programFiles, "Antigravity", "Antigravity.exe")
      ];

      for (const candidate of ag2Candidates) {
        if (fs.existsSync(candidate)) {
          logger.warn(`Antigravity IDE was not found, falling back to Antigravity 2.0 at: ${candidate}`);
          return candidate;
        }
      }
    }

    logger.warn("Antigravity executable could not be auto-detected.");
    throw new AppError(
      "ANTIGRAVITY_NOT_FOUND",
      "Antigravity IDE executable was not found. Please configure it manually in Settings.",
      true
    );
  }
}

export const antigravityLocator = new AntigravityLocator();
