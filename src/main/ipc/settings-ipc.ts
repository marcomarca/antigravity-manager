import { ipcMain } from "electron";
import type { Config } from "../../domain/types";
import type { ConfigService } from "../../services/config-service";
import { AppError } from "../../domain/errors";
import { logger } from "../../adapters/logger";

export function registerSettingsIpc(
  configService: ConfigService,
  onConfigChanged?: (newConfig: Config) => void
): void {
  ipcMain.handle("settings:get", async () => {
    try {
      return configService.get();
    } catch (err) {
      logger.error("IPC Error in settings:get", err);
      throw AppError.from(err).toPayload();
    }
  });

  ipcMain.handle("settings:update", async (_event, patch: Partial<Config>) => {
    try {
      const updated = await configService.update(patch);
      if (onConfigChanged) {
        onConfigChanged(updated);
      }
      return updated;
    } catch (err) {
      logger.error("IPC Error in settings:update", err);
      throw AppError.from(err).toPayload();
    }
  });
}
