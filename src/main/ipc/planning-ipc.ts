import { ipcMain } from "electron";
import type { PlanningService } from "../../services/planning-service";
import { AppError } from "../../domain/errors";
import { logger } from "../../adapters/logger";

export function registerPlanningIpc(planningService: PlanningService): void {
  ipcMain.handle("planning:start", async () => {
    try {
      return await planningService.start();
    } catch (err) {
      logger.error("IPC Error in planning:start", err);
      throw AppError.from(err).toPayload();
    }
  });
}
