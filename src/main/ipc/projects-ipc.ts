import { ipcMain, shell, clipboard } from "electron";
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

  ipcMain.handle("projects:setDescription", async (_event, path: string, description: string) => {
    try {
      await metadataService.setDescription(path, description);
    } catch (err) {
      logger.error(`IPC Error in projects:setDescription for "${path}"`, err);
      throw AppError.from(err).toPayload();
    }
  });

  ipcMain.handle("projects:setPinned", async (_event, path: string, pinned: boolean) => {
    try {
      await metadataService.setPinned(path, pinned);
    } catch (err) {
      logger.error(`IPC Error in projects:setPinned for "${path}"`, err);
      throw AppError.from(err).toPayload();
    }
  });

  ipcMain.handle("projects:setTags", async (_event, path: string, tags: string[]) => {
    try {
      await metadataService.setTags(path, tags);
    } catch (err) {
      logger.error(`IPC Error in projects:setTags for "${path}"`, err);
      throw AppError.from(err).toPayload();
    }
  });

  ipcMain.handle("projects:openFolder", async (_event, projectPath: string) => {
    try {
      if (projectPath.endsWith(".md") || projectPath.endsWith(".code-workspace")) {
        shell.showItemInFolder(projectPath);
      } else {
        await shell.openPath(projectPath);
      }
    } catch (err) {
      logger.error(`IPC Error in projects:openFolder for "${projectPath}"`, err);
      throw AppError.from(err).toPayload();
    }
  });

  ipcMain.handle("projects:copyPath", async (_event, projectPath: string) => {
    try {
      clipboard.writeText(projectPath);
    } catch (err) {
      logger.error(`IPC Error in projects:copyPath for "${projectPath}"`, err);
      throw AppError.from(err).toPayload();
    }
  });
}
