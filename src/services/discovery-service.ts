import * as fs from "node:fs";
import type { Project, RecentProject } from "../domain/types";
import { canonicalPathKey, normalizePath } from "../domain/canonical-path";
import { antigravityStateDbProvider } from "../adapters/antigravity-state-db-provider";
import { projectsRootProvider } from "../adapters/projects-root-provider";
import { ConfigService } from "./config-service";
import { MetadataService } from "./metadata-service";
import { logger } from "../adapters/logger";
import { filterAndRankProjects } from "../domain/search-ranker";

export class DiscoveryService {
  constructor(
    private configService: ConfigService,
    private metadataService: MetadataService
  ) {}

  public async listProjects(): Promise<Project[]> {
    const config = this.configService.get();
    const map = new Map<string, Project>();

    // 1. Antigravity recents
    try {
      const recents: RecentProject[] = await antigravityStateDbProvider.list();
      for (const rec of recents) {
        if (!fs.existsSync(rec.path)) {
          // Hide deleted / non-existing recents from list per section 45
          continue;
        }

        const key = canonicalPathKey(rec.path);
        map.set(key, {
          name: rec.name,
          path: normalizePath(rec.path),
          type: rec.type,
          exists: true,
          source: {
            antigravityRecent: true,
            projectsRoot: false
          },
          recentIndex: rec.recentIndex,
          note: this.metadataService.getNote(rec.path)
        });
      }
    } catch (err) {
      logger.warn("Failed retrieving recent projects from Antigravity DB", err);
    }

    // 2. Scan projectsRoot
    try {
      const rootProjects = await projectsRootProvider.list(config.projectsRoot);
      for (const rootProj of rootProjects) {
        const key = canonicalPathKey(rootProj.path);
        const existing = map.get(key);

        if (existing) {
          existing.source.projectsRoot = true;
        } else {
          map.set(key, {
            ...rootProj,
            note: this.metadataService.getNote(rootProj.path)
          });
        }
      }
    } catch (err) {
      logger.warn("Failed retrieving projects from projectsRoot", err);
    }

    const allProjects = Array.from(map.values());
    return filterAndRankProjects(allProjects, "");
  }
}
