import { app } from "electron";
import { autoUpdater, type UpdateInfo } from "electron-updater";
import { logger } from "../adapters/logger";

export type UpdateStatusState =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UpdateStatus {
  state: UpdateStatusState;
  version?: string;
  percent?: number;
  message?: string;
}

export class UpdateService {
  private currentStatus: UpdateStatus = { state: "idle" };
  private listeners: Array<(status: UpdateStatus) => void> = [];
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.currentStatus = { state: "idle" };
  }

  public init(): void {
    if (!app.isPackaged) {
      logger.info("[AutoUpdater] Running in unpacked/development mode. Background checks disabled.");
      return;
    }

    try {
      autoUpdater.logger = logger;
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;

      this.registerEvents();

      // Initial check after startup grace period (5 seconds)
      setTimeout(() => {
        this.checkForUpdates().catch((err) => {
          logger.warn("[AutoUpdater] Initial update check failed:", err);
        });
      }, 5000);

      // Periodic check every 4 hours
      this.checkInterval = setInterval(() => {
        this.checkForUpdates().catch((err) => {
          logger.warn("[AutoUpdater] Periodic update check failed:", err);
        });
      }, 4 * 60 * 60 * 1000);
    } catch (err) {
      logger.error("[AutoUpdater] Failed to initialize UpdateService:", err);
    }
  }

  private registerEvents(): void {
    autoUpdater.on("checking-for-update", () => {
      logger.info("[AutoUpdater] Checking for update...");
      this.setStatus({ state: "checking" });
    });

    autoUpdater.on("update-available", (info: UpdateInfo) => {
      logger.info(`[AutoUpdater] Update available: v${info.version}`);
      this.setStatus({ state: "available", version: info.version });
    });

    autoUpdater.on("update-not-available", (info: UpdateInfo) => {
      logger.info(`[AutoUpdater] Update not available. Current version: v${info.version}`);
      this.setStatus({ state: "not-available", version: info.version });
    });

    autoUpdater.on("error", (err: Error) => {
      logger.warn(`[AutoUpdater] Error in auto-updater: ${err.message}`);
      this.setStatus({ state: "error", message: err.message });
    });

    autoUpdater.on("download-progress", (progressObj) => {
      const percent = Math.round(progressObj.percent || 0);
      this.setStatus({ state: "downloading", percent });
    });

    autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
      logger.info(`[AutoUpdater] Update downloaded: v${info.version}. Ready to install on quit.`);
      this.setStatus({ state: "downloaded", version: info.version });
    });
  }

  public async checkForUpdates(): Promise<{ success: boolean; message?: string }> {
    if (!app.isPackaged) {
      this.setStatus({ state: "not-available", message: "Dev mode" });
      return { success: false, message: "Updates are disabled in development mode." };
    }

    try {
      this.setStatus({ state: "checking" });
      const result = await autoUpdater.checkForUpdates();
      return { success: true, message: result?.updateInfo?.version };
    } catch (err: any) {
      logger.warn("[AutoUpdater] Manual check error:", err);
      this.setStatus({ state: "error", message: err.message });
      return { success: false, message: err.message || "Failed to check for updates." };
    }
  }

  public quitAndInstall(): void {
    if (!app.isPackaged) {
      logger.warn("[AutoUpdater] quitAndInstall called in dev mode, ignoring.");
      return;
    }

    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (err) {
      logger.error("[AutoUpdater] Failed to quit and install update:", err);
    }
  }

  public getStatus(): UpdateStatus {
    return { ...this.currentStatus };
  }

  public getVersion(): string {
    return app.getVersion();
  }

  public onStatusChange(callback: (status: UpdateStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private setStatus(status: UpdateStatus): void {
    this.currentStatus = status;
    for (const listener of this.listeners) {
      try {
        listener(this.getStatus());
      } catch (err) {
        logger.error("[AutoUpdater] Error in status listener:", err);
      }
    }
  }

  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.listeners = [];
  }
}
