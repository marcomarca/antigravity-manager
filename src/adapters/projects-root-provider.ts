import * as fs from "node:fs";
import * as path from "node:path";
import type { Project } from "../domain/types";
import { normalizePath } from "../domain/canonical-path";
import { logger } from "./logger";

export class ProjectsRootProvider {
  public async list(projectsRoot: string): Promise<Project[]> {
    if (!projectsRoot || !fs.existsSync(projectsRoot)) {
      return [];
    }

    try {
      const entries = await fs.promises.readdir(projectsRoot, { withFileTypes: true });
      const dirEntries = entries.filter((e) => e.isDirectory());
      const projects: Project[] = await Promise.all(
        dirEntries.map(async (entry) => {
          const fullPath = path.join(projectsRoot, entry.name);
          let createdAt: number | undefined;
          let modifiedAt: number | undefined;

          try {
            const stat = await fs.promises.stat(fullPath);
            createdAt = stat.birthtimeMs || stat.ctimeMs;
            modifiedAt = stat.mtimeMs;
          } catch {
            // Graceful fallback if stat fails
          }

          return {
            name: entry.name,
            path: normalizePath(fullPath),
            type: "folder" as const,
            exists: true,
            source: {
              antigravityRecent: false,
              projectsRoot: true
            },
            createdAt,
            modifiedAt
          };
        })
      );

      return projects;
    } catch (err) {
      logger.warn(`Failed reading projectsRoot directory "${projectsRoot}": ${err}`);
      return [];
    }
  }
}

export const projectsRootProvider = new ProjectsRootProvider();
