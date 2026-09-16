import { globalShortcut } from "electron";
import { logger } from "../adapters/logger";
import { windowManager } from "./window";

export class HotkeyManager {
  private currentHotkey: string | null = null;

  public register(hotkey: string): boolean {
    this.unregister();

    try {
      const ok = globalShortcut.register(hotkey, () => {
        logger.info(`Global hotkey "${hotkey}" triggered.`);
        windowManager.toggle();
      });

      if (ok) {
        this.currentHotkey = hotkey;
        logger.info(`Successfully registered global hotkey: "${hotkey}"`);
        return true;
      } else {
        logger.warn(`Failed to register global hotkey: "${hotkey}". Key might be occupied by another app.`);
        return false;
      }
    } catch (err) {
      logger.error(`Error while registering hotkey "${hotkey}"`, err);
      return false;
    }
  }

  public unregister(): void {
    if (this.currentHotkey) {
      globalShortcut.unregister(this.currentHotkey);
      this.currentHotkey = null;
    }
  }

  public unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.currentHotkey = null;
  }
}

export const hotkeyManager = new HotkeyManager();
