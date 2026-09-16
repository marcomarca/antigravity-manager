import { spawn } from "node:child_process";
import * as fs from "node:fs";
import { AppError } from "../domain/errors";
import { logger } from "./logger";
import { antigravityLocator } from "./antigravity-locator";

export class AntigravityLauncher {
  public async open(targetPath: string, customExecutable?: string | null): Promise<void> {
    if (!fs.existsSync(targetPath)) {
      throw new AppError("INVALID_PROJECT_NAME", `Target project path "${targetPath}" does not exist.`);
    }

    const executable = await antigravityLocator.locate(customExecutable);

    try {
      logger.info(`Launching Antigravity IDE: "${executable}" with target: "${targetPath}"`);

      const isWindowsScript = process.platform === "win32" && /\.(cmd|bat)$/i.test(executable);

      const child = spawn(executable, [targetPath], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
        shell: isWindowsScript
      });

      child.on("error", (err) => {
        logger.error(`Error spawned from Antigravity process: ${err.message}`, err);
      });

      child.unref();
    } catch (err) {
      logger.error("Failed to spawn Antigravity process", err);
      throw new AppError(
        "ANTIGRAVITY_LAUNCH_FAILED",
        `Failed to launch Antigravity: ${err instanceof Error ? err.message : String(err)}`,
        true,
        err
      );
    }
  }
}

export const antigravityLauncher = new AntigravityLauncher();
