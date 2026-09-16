import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { MetadataService } from "../../src/services/metadata-service";

describe("MetadataService", () => {
  const tempDir = path.join(os.tmpdir(), `launcher_test_metadata_${Date.now()}`);

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("persists project notes per canonical path", async () => {
    const service = new MetadataService(tempDir);
    await service.init();

    const projectPath = "C:\\Projects\\Invoice API";
    await service.setNote(projectPath, "Client needs staging API keys");

    expect(service.getNote(projectPath)).toBe("Client needs staging API keys");
    expect(service.getNote("c:/projects/invoice api/")).toBe("Client needs staging API keys");

    // Check persistence across reload
    const reloadedService = new MetadataService(tempDir);
    await reloadedService.init();

    expect(reloadedService.getNote(projectPath)).toBe("Client needs staging API keys");
  });

  it("removes note when set to empty string", async () => {
    const service = new MetadataService(tempDir);
    await service.init();

    const projectPath = "C:\\Projects\\Invoice API";
    await service.setNote(projectPath, "    ");

    expect(service.getNote(projectPath)).toBeUndefined();
  });
});
