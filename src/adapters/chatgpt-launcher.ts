import { exec } from "node:child_process";
import { clipboard } from "electron";
import type { ChatGPTMode } from "../domain/types";
import { logger } from "./logger";
import { windowsAutomation } from "./windows-automation";

export class ChatGPTLauncher {
  public async launch(promptText: string, mode: ChatGPTMode = "auto"): Promise<{ pasted: boolean }> {
    // 1. Copy prompt to clipboard
    try {
      clipboard.writeText(promptText);
      logger.info("Planning prompt written to clipboard.");
    } catch (err) {
      logger.warn("Could not copy prompt via Electron clipboard", err);
    }

    // 2. Open ChatGPT
    const webUrl = "https://chatgpt.com/";
    const desktopProtocol = "chatgpt://";

    if (mode === "desktop") {
      this.openTarget(desktopProtocol);
    } else if (mode === "web") {
      this.openTarget(webUrl);
    } else {
      // Auto: Try desktop protocol first, with web fallback if protocol fails
      this.openTarget(desktopProtocol, () => {
        this.openTarget(webUrl);
      });
    }

    // 3. Wait for window to load and check if active window matches ChatGPT before pasting
    let pasted = false;
    if (process.platform === "win32") {
      await new Promise((res) => setTimeout(res, 1200));
      pasted = await windowsAutomation.sendPasteIfWindowMatches("ChatGPT");
    }

    return { pasted };
  }

  private openTarget(target: string, onErrorFallback?: () => void): void {
    if (process.platform === "win32") {
      exec(`start "" "${target}"`, (err) => {
        if (err && onErrorFallback) {
          logger.warn(`Failed opening "${target}", trying fallback...`);
          onErrorFallback();
        }
      });
    } else {
      exec(`open "${target}"`, (err) => {
        if (err && onErrorFallback) {
          onErrorFallback();
        }
      });
    }
  }
}

export const chatgptLauncher = new ChatGPTLauncher();
