import * as fs from "node:fs";
import * as path from "node:path";
import type { ImportMarkdownRequest, Project } from "../domain/types";
import { AppError } from "../domain/errors";
import { assertValidProjectName, deriveProjectNameFromMarkdown } from "../domain/validation";
import { assertInsideProjectsRoot, normalizePath } from "../domain/canonical-path";
import { ConfigService } from "./config-service";
import { MetadataService } from "./metadata-service";
import { antigravityLauncher } from "../adapters/antigravity-launcher";
import { logger } from "../adapters/logger";

export class ProjectService {
  constructor(
    private configService: ConfigService,
    private metadataService: MetadataService
  ) {}

  public async create(name: string): Promise<Project> {
    const validName = assertValidProjectName(name);
    const config = this.configService.get();
    const projectsRoot = config.projectsRoot;

    // Ensure projectsRoot exists
    if (!fs.existsSync(projectsRoot)) {
      await fs.promises.mkdir(projectsRoot, { recursive: true });
    }

    const projectPath = path.join(projectsRoot, validName);
    assertInsideProjectsRoot(projectPath, projectsRoot);

    if (fs.existsSync(projectPath)) {
      throw new AppError("PROJECT_EXISTS", `A project named "${validName}" already exists.`, true, {
        path: projectPath,
        name: validName
      });
    }

    try {
      await fs.promises.mkdir(projectPath, { recursive: true });
      logger.info(`Created project directory at: ${projectPath}`);
    } catch (err) {
      logger.error(`Failed to create directory at ${projectPath}`, err);
      throw new AppError("STATE_WRITE_FAILED", "Failed to create project folder.", true, err);
    }

    // Launch Antigravity
    try {
      await antigravityLauncher.open(projectPath, config.antigravityExecutable);
    } catch (err) {
      logger.warn(`Project was created at "${projectPath}", but opening Antigravity failed: ${err}`);
    }

    return {
      name: validName,
      path: normalizePath(projectPath),
      type: "folder",
      exists: true,
      source: {
        antigravityRecent: false,
        projectsRoot: true
      },
      note: this.metadataService.getNote(projectPath)
    };
  }

  public async importMarkdown(req: ImportMarkdownRequest): Promise<Project> {
    const { filePath, overrideCollision } = req;

    if (!filePath || !fs.existsSync(filePath)) {
      throw new AppError("INVALID_MARKDOWN", "Selected Markdown file does not exist.");
    }

    const projectName = deriveProjectNameFromMarkdown(filePath);
    const config = this.configService.get();
    const projectsRoot = config.projectsRoot;

    if (!fs.existsSync(projectsRoot)) {
      await fs.promises.mkdir(projectsRoot, { recursive: true });
    }

    const targetProjectDir = path.join(projectsRoot, projectName);
    assertInsideProjectsRoot(targetProjectDir, projectsRoot);

    const fileName = path.basename(filePath);
    const targetFilePath = path.join(targetProjectDir, fileName);

    const folderExists = fs.existsSync(targetProjectDir);

    if (folderExists && !overrideCollision) {
      throw new AppError("PROJECT_EXISTS", `A project named "${projectName}" already exists.`, true, {
        path: targetProjectDir,
        name: projectName,
        folderExists: true
      });
    }

    const fileExists = fs.existsSync(targetFilePath);
    if (fileExists && overrideCollision !== "replace") {
      throw new AppError("PROJECT_EXISTS", `The file "${fileName}" already exists in the project.`, true, {
        path: targetFilePath,
        name: projectName,
        fileExists: true
      });
    }

    let createdFolder = false;
    if (!folderExists) {
      await fs.promises.mkdir(targetProjectDir, { recursive: true });
      createdFolder = true;
    }

    try {
      await fs.promises.copyFile(filePath, targetFilePath);
      logger.info(`Copied markdown "${filePath}" -> "${targetFilePath}"`);
    } catch (err) {
      // Rollback newly created empty folder
      if (createdFolder) {
        try {
          const files = await fs.promises.readdir(targetProjectDir);
          if (files.length === 0) {
            await fs.promises.rmdir(targetProjectDir);
          }
        } catch {
          // Ignore rollback failure
        }
      }
      logger.error("Failed copying markdown file into project", err);
      throw new AppError("STATE_WRITE_FAILED", "Failed to copy Markdown file into project.", true, err);
    }

    // Launch Antigravity
    try {
      await antigravityLauncher.open(targetProjectDir, config.antigravityExecutable);
    } catch (err) {
      logger.warn(`Markdown imported into "${targetProjectDir}", but opening Antigravity failed: ${err}`);
    }

    return {
      name: projectName,
      path: normalizePath(targetProjectDir),
      type: "folder",
      exists: true,
      source: {
        antigravityRecent: false,
        projectsRoot: true
      },
      note: this.metadataService.getNote(targetProjectDir)
    };
  }

  public async open(targetPath: string): Promise<void> {
    if (!targetPath || !fs.existsSync(targetPath)) {
      throw new AppError("INVALID_PROJECT_NAME", `Target project "${targetPath}" does not exist.`);
    }

    const config = this.configService.get();
    await antigravityLauncher.open(targetPath, config.antigravityExecutable);
  }
}
