import { BrowserWindow, ipcMain } from "electron";
import type { UpdateService } from "../../services/update-service";
import { logger } from "../../adapters/logger";

export function registerUpdaterIpc(updateService: UpdateService): void {
  ipcMain.handle("updater:check", async () => {
    try {
      return await updateService.checkForUpdates();
    } catch (err: any) {
      logger.error("IPC Error in updater:check", err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle("updater:quitAndInstall", () => {
    try {
      updateService.quitAndInstall();
    } catch (err: any) {
      logger.error("IPC Error in updater:quitAndInstall", err);
    }
  });

  ipcMain.handle("updater:getStatus", () => {
    return updateService.getStatus();
  });

  ipcMain.handle("updater:getVersion", () => {
    return updateService.getVersion();
  });

  // Broadcast status changes to renderer windows
  updateService.onStatusChange((status) => {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send("updater:statusChanged", status);
      }
    }
  });
}
