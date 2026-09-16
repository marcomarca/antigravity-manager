import { ipcMain } from "electron";
import type { ImportMarkdownRequest } from "../../domain/types";
import type { DiscoveryService } from "../../services/discovery-service";
import type { ProjectService } from "../../services/project-service";
import type { MetadataService } from "../../services/metadata-service";
import { AppError } from "../../domain/errors";
import { logger } from "../../adapters/logger";

export function registerProjectsIpc(
  discoveryService: DiscoveryService,
  projectService: ProjectService,
  metadataService: MetadataService
): void {
  ipcMain.handle("projects:list", async () => {
    try {
      return await discoveryService.listProjects();
    } catch (err) {
      logger.error("IPC Error in projects:list", err);
      throw AppError.from(err).toPayload();
    }
  });

  ipcMain.handle("projects:open", async (_event, path: string) => {
    try {
      await projectService.open(path);
    } catch (err) {
      logger.error(`IPC Error in projects:open for "${path}"`, err);
      throw AppError.from(err).toPayload();
    }
  });

  ipcMain.handle("projects:create", async (_event, name: string) => {
    try {
      return await projectService.create(name);
    } catch (err) {
      logger.error(`IPC Error in projects:create for "${name}"`, err);
      throw AppError.from(err).toPayload();
    }
  });

  ipcMain.handle("projects:importMarkdown", async (_event, req: ImportMarkdownRequest) => {
    try {
      return await projectService.importMarkdown(req);
    } catch (err) {
      logger.error("IPC Error in projects:importMarkdown", err);
      throw AppError.from(err).toPayload();
    }
  });

  ipcMain.handle("projects:setNote", async (_event, path: string, note: string) => {
    try {
      await metadataService.setNote(path, note);
    } catch (err) {
      logger.error(`IPC Error in projects:setNote for "${path}"`, err);
      throw AppError.from(err).toPayload();
    }
  });
}
