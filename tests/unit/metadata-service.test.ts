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

  it("persists project description per canonical path", async () => {
    const service = new MetadataService(tempDir);
    await service.init();

    const projectPath = "C:\\Projects\\Invoice API";
    await service.setDescription(projectPath, "Microservice handling invoice billing and Stripe webhooks");

    expect(service.getDescription(projectPath)).toBe("Microservice handling invoice billing and Stripe webhooks");
    expect(service.getDescription("c:/projects/invoice api/")).toBe("Microservice handling invoice billing and Stripe webhooks");

    // Check persistence across reload
    const reloadedService = new MetadataService(tempDir);
    await reloadedService.init();

    expect(reloadedService.getDescription(projectPath)).toBe("Microservice handling invoice billing and Stripe webhooks");
  });

  it("maintains description when note is cleared, and removes project only when both are empty", async () => {
    const service = new MetadataService(tempDir);
    await service.init();

    const projectPath = "C:\\Projects\\Web App";
    await service.setDescription(projectPath, "Main dashboard");
    await service.setNote(projectPath, "Fix responsive bug");

    // Clear note
    await service.setNote(projectPath, "");
    expect(service.getNote(projectPath)).toBeUndefined();
    expect(service.getDescription(projectPath)).toBe("Main dashboard");

    // Clear description too -> entry completely removed
    await service.setDescription(projectPath, "   ");
    expect(service.getDescription(projectPath)).toBeUndefined();
    expect(service.get(projectPath)).toEqual({});
  });
});
