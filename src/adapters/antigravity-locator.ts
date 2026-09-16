import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import { AppError } from "../domain/errors";
import { logger } from "./logger";

export class AntigravityLocator {
  public async locate(customPath?: string | null): Promise<string> {
    // 1. Configured custom path
    if (customPath && fs.existsSync(customPath)) {
      return customPath;
    }

    // 2. Known default Windows installation paths
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    const programFiles = process.env.ProgramFiles || "C:\\Program Files";
    const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

    const candidates = [
      path.join(localAppData, "Programs", "Antigravity", "Antigravity.exe"),
      path.join(localAppData, "Programs", "Antigravity IDE", "Antigravity.exe"),
      path.join(programFiles, "Antigravity", "Antigravity.exe"),
      path.join(programFiles, "Antigravity IDE", "Antigravity.exe"),
      path.join(programFilesX86, "Antigravity", "Antigravity.exe"),
      // Fallback detection for VS Code environments if Antigravity is not yet installed
      path.join(localAppData, "Programs", "Microsoft VS Code", "Code.exe"),
      path.join(programFiles, "Microsoft VS Code", "Code.exe")
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        logger.info(`Found IDE executable at: ${candidate}`);
        return candidate;
      }
    }

    // 3. Search in system PATH
    try {
      const output = execSync("where.exe antigravity", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      const firstLine = output.split(/\r?\n/)[0]?.trim();
      if (firstLine && fs.existsSync(firstLine)) {
        logger.info(`Found IDE executable via PATH: ${firstLine}`);
        return firstLine;
      }
    } catch {
      // Not found in PATH
    }

    logger.warn("Antigravity executable could not be auto-detected.");
    throw new AppError(
      "ANTIGRAVITY_NOT_FOUND",
      "Antigravity IDE executable was not found. Please locate it manually in Settings.",
      true
    );
  }
}

export const antigravityLocator = new AntigravityLocator();
