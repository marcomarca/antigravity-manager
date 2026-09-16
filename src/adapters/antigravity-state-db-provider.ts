import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { RecentProject } from "../domain/types";
import { normalizePath } from "../domain/canonical-path";
import { logger } from "./logger";

export class AntigravityStateDbProvider {
  private findDbPaths(): string[] {
    const appData = process.env.APPDATA || (process.platform === "win32"
      ? path.join(os.homedir(), "AppData", "Roaming")
      : path.join(os.homedir(), ".config"));

    return [
      path.join(appData, "Antigravity IDE", "User", "globalStorage", "state.vscdb"),
      path.join(appData, "Antigravity", "User", "globalStorage", "state.vscdb"),
      path.join(appData, "Code", "User", "globalStorage", "state.vscdb"),
      path.join(appData, "Cursor", "User", "globalStorage", "state.vscdb")
    ];
  }

  public async list(): Promise<RecentProject[]> {
    const dbPaths = this.findDbPaths();

    for (const dbPath of dbPaths) {
      if (fs.existsSync(dbPath)) {
        try {
          const recents = await this.queryDb(dbPath);
          if (recents.length > 0) {
            return recents;
          }
        } catch (err) {
          logger.warn(`Failed reading recents from ${dbPath}: ${err}`);
        }
      }
    }

    return [];
  }

  private async queryDb(dbPath: string): Promise<RecentProject[]> {
    let rawValue: string | null = null;

    // 1. Try node:sqlite or bun:sqlite or fallback
    try {
      // @ts-ignore
      const sqlite = await import("node:sqlite");
      if (sqlite.DatabaseSync) {
        const db = new sqlite.DatabaseSync(dbPath, { readOnly: true });
        const query = db.prepare("SELECT value FROM ItemTable WHERE key = 'history.recentlyOpenedPathsList'");
        const result = query.get() as { value: string } | undefined;
        db.close();
        if (result && typeof result.value === "string") {
          rawValue = result.value;
        }
      }
    } catch {
      // node:sqlite might not be available or bun runtime
    }

    if (!rawValue) {
      try {
        // @ts-ignore
        const bunSqlite = await import("bun:sqlite");
        if (bunSqlite.Database) {
          const db = new bunSqlite.Database(dbPath, { readonly: true });
          const row = db.query("SELECT value FROM ItemTable WHERE key = 'history.recentlyOpenedPathsList'").get() as { value: string } | null;
          db.close();
          if (row && typeof row.value === "string") {
            rawValue = row.value;
          }
        }
      } catch {
        // Not bun
      }
    }

    if (!rawValue) {
      // Robust Fallback: binary buffer scan across all occurrences in SQLite file
      rawValue = this.fallbackBufferExtract(dbPath);
    }

    if (!rawValue) {
      return [];
    }

    return this.parseRecentsJson(rawValue);
  }

  private fallbackBufferExtract(dbPath: string): string | null {
    try {
      const buffer = fs.readFileSync(dbPath);
      const str = buffer.toString("utf8");
      const needle = "history.recentlyOpenedPathsList";
      let bestCandidate: string | null = null;
      let maxCount = -1;
      let idx = 0;

      while (true) {
        idx = str.indexOf(needle, idx);
        if (idx === -1) break;

        const braceIndex = str.indexOf('{"entries":', idx);
        if (braceIndex !== -1 && braceIndex < idx + 4096) {
          let openBraces = 0;
          let endIndex = -1;
          for (let i = braceIndex; i < str.length && i < braceIndex + 1000000; i++) {
            if (str[i] === "{") openBraces++;
            else if (str[i] === "}") {
              openBraces--;
              if (openBraces === 0) {
                endIndex = i + 1;
                break;
              }
            }
          }

          if (endIndex > braceIndex) {
            const candidate = str.slice(braceIndex, endIndex);
            try {
              const parsed = JSON.parse(candidate);
              const count = Array.isArray(parsed.entries) ? parsed.entries.length : 0;
              if (count > maxCount) {
                maxCount = count;
                bestCandidate = candidate;
              }
            } catch {
              // Ignore malformed candidate
            }
          }
        }
        idx += needle.length;
      }

      return bestCandidate;
    } catch (err) {
      logger.warn("fallbackBufferExtract encountered error", err);
    }
    return null;
  }

  public parseRecentsJson(rawJson: string): RecentProject[] {
    try {
      const data = JSON.parse(rawJson);
      const entries = data.entries || [];
      const results: RecentProject[] = [];

      let index = 0;
      for (const entry of entries) {
        let uriStr = "";
        let isWorkspace = false;
        let label = entry.label || "";

        if (typeof entry === "string") {
          uriStr = entry;
        } else if (entry.folderUri) {
          uriStr = entry.folderUri;
        } else if (entry.workspace && entry.workspace.configPath) {
          uriStr = entry.workspace.configPath;
          isWorkspace = true;
        } else if (entry.fileUri && entry.fileUri.endsWith(".code-workspace")) {
          uriStr = entry.fileUri;
          isWorkspace = true;
        }

        if (!uriStr) continue;

        const resolvedPath = this.uriToPath(uriStr);
        if (!resolvedPath) continue;

        if (!label) {
          const parts = resolvedPath.replace(/\\/g, "/").split("/");
          label = parts.pop() || "Untitled Project";
          if (isWorkspace && label.endsWith(".code-workspace")) {
            label = label.slice(0, -".code-workspace".length);
          }
        }

        results.push({
          path: normalizePath(resolvedPath),
          name: label,
          type: isWorkspace ? "workspace" : "folder",
          recentIndex: index++
        });
      }

      return results;
    } catch (err) {
      logger.warn("Failed to parse recentlyOpenedPathsList JSON", err);
      return [];
    }
  }

  private uriToPath(uri: string): string {
    try {
      if (uri.startsWith("file:///")) {
        const decoded = decodeURIComponent(uri.replace(/^file:\/\/\//, ""));
        return decoded.replace(/\//g, "\\");
      }
      if (uri.startsWith("file://")) {
        const decoded = decodeURIComponent(uri.replace(/^file:\/\//, ""));
        return decoded.replace(/\//g, "\\");
      }
      return uri.replace(/\//g, "\\");
    } catch {
      return "";
    }
  }
}

export const antigravityStateDbProvider = new AntigravityStateDbProvider();
