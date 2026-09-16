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
      const projects: Project[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(projectsRoot, entry.name);
          projects.push({
            name: entry.name,
            path: normalizePath(fullPath),
            type: "folder",
            exists: true,
            source: {
              antigravityRecent: false,
              projectsRoot: true
            }
          });
        }
      }

      return projects;
    } catch (err) {
      logger.warn(`Failed reading projectsRoot directory "${projectsRoot}": ${err}`);
      return [];
    }
  }
}

export const projectsRootProvider = new ProjectsRootProvider();
