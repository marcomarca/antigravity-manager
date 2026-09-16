import { describe, expect, it } from "bun:test";
import { AntigravityStateDbProvider } from "../../src/adapters/antigravity-state-db-provider";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

describe("AntigravityStateDbProvider", () => {
  const provider = new AntigravityStateDbProvider();

  it("parses valid JSON recent projects with encoded URIs correctly", () => {
    const rawJson = JSON.stringify({
      entries: [
        { folderUri: "file:///d%3A/apps-2026/my-project" },
        { folderUri: "file:///c%3A/Users/Test/another-app", label: "Custom Label" },
        { fileUri: "file:///c%3A/Users/Test/workspace.code-workspace" }
      ]
    });

    const parsed = provider.parseRecentsJson(rawJson);
    expect(parsed.length).toBe(3);
    expect(parsed[0]!.name).toBe("my-project");
    expect(parsed[0]!.path).toBe("d:\\apps-2026\\my-project");
    expect(parsed[0]!.type).toBe("folder");

    expect(parsed[1]!.name).toBe("Custom Label");
    expect(parsed[1]!.path).toBe("c:\\Users\\Test\\another-app");

    expect(parsed[2]!.name).toBe("workspace");
    expect(parsed[2]!.type).toBe("workspace");
  });

  it("extracts populated recents JSON from SQLite buffer even if preceded by empty candidate records", () => {
    const tempFile = path.join(os.tmpdir(), `test_vscdb_${Date.now()}.db`);
    
    // Simulate an SQLite file containing an empty fragment followed by the actual populated entries
    const dummyEmpty = 'padding_data_history.recentlyOpenedPathsList_item_{"entries":[]}_more_bytes';
    const populated = JSON.stringify({
      entries: [
        { folderUri: "file:///d%3A/apps-2026/real-app-1" },
        { folderUri: "file:///d%3A/apps-2026/real-app-2" }
      ]
    });
    const dummyFull = `more_bytes_history.recentlyOpenedPathsList_item_${populated}_trailing`;
    
    fs.writeFileSync(tempFile, dummyEmpty + dummyFull, "utf8");

    try {
      // @ts-ignore - access private method for testing
      const extracted = provider["fallbackBufferExtract"](tempFile);
      expect(extracted).not.toBeNull();
      const recents = provider.parseRecentsJson(extracted!);
      expect(recents.length).toBe(2);
      expect(recents[0]!.name).toBe("real-app-1");
      expect(recents[1]!.name).toBe("real-app-2");
    } finally {
      try {
        fs.unlinkSync(tempFile);
      } catch {}
    }
  });
});
