import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { ConfigService } from "../../src/services/config-service";
import { MetadataService } from "../../src/services/metadata-service";
import { DiscoveryService } from "../../src/services/discovery-service";

describe("DiscoveryService Integration", () => {
  const tempDir = path.join(os.tmpdir(), `launcher_int_disc_${Date.now()}`);
  const projectsRoot = path.join(tempDir, "Projects");
  let configService: ConfigService;
  let metadataService: MetadataService;
  let discoveryService: DiscoveryService;

  beforeAll(async () => {
    fs.mkdirSync(path.join(projectsRoot, "Service Alpha"), { recursive: true });
    fs.mkdirSync(path.join(projectsRoot, "Service Beta"), { recursive: true });

    configService = new ConfigService(tempDir);
    await configService.init();
    await configService.update({ projectsRoot });

    metadataService = new MetadataService(tempDir);
    await metadataService.init();
    await metadataService.setNote(path.join(projectsRoot, "Service Alpha"), "Alpha service note");

    discoveryService = new DiscoveryService(configService, metadataService);
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("lists all discovered folders from projectsRoot with metadata attached", async () => {
    const list = await discoveryService.listProjects();
    expect(list.length).toBeGreaterThanOrEqual(2);

    const alpha = list.find((p) => p.name === "Service Alpha");
    expect(alpha).toBeDefined();
    expect(alpha?.note).toBe("Alpha service note");

    const beta = list.find((p) => p.name === "Service Beta");
    expect(beta).toBeDefined();
  });
});
