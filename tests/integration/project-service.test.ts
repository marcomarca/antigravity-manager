import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { ConfigService } from "../../src/services/config-service";
import { MetadataService } from "../../src/services/metadata-service";
import { ProjectService } from "../../src/services/project-service";

describe("ProjectService Integration", () => {
  const tempDir = path.join(os.tmpdir(), `launcher_int_proj_${Date.now()}`);
  const projectsRoot = path.join(tempDir, "Projects");
  let configService: ConfigService;
  let metadataService: MetadataService;
  let projectService: ProjectService;

  beforeAll(async () => {
    fs.mkdirSync(projectsRoot, { recursive: true });
    configService = new ConfigService(tempDir);
    await configService.init();
    await configService.update({ projectsRoot });

    metadataService = new MetadataService(tempDir);
    await metadataService.init();

    projectService = new ProjectService(configService, metadataService);
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("creates a new project directory", async () => {
    const proj = await projectService.create("Invoice API");
    expect(proj.name).toBe("Invoice API");
    expect(fs.existsSync(proj.path)).toBe(true);
  });

  it("throws error on project creation collision", async () => {
    await expect(projectService.create("Invoice API")).rejects.toThrow();
  });

  it("imports a Markdown file into a new project directory", async () => {
    const mdFile = path.join(tempDir, "Website Redesign.md");
    fs.writeFileSync(mdFile, "# Website Redesign\n\nScope details...", "utf8");

    const proj = await projectService.importMarkdown({ filePath: mdFile });
    expect(proj.name).toBe("Website Redesign");

    const expectedDir = path.join(projectsRoot, "Website Redesign");
    expect(fs.existsSync(expectedDir)).toBe(true);

    const targetMd = path.join(expectedDir, "Website Redesign.md");
    expect(fs.existsSync(targetMd)).toBe(true);
    expect(fs.readFileSync(targetMd, "utf8")).toContain("Scope details");
  });

  it("handles collision during Markdown import without overwriting without explicit consent", async () => {
    const mdFile = path.join(tempDir, "Website Redesign.md");
    await expect(projectService.importMarkdown({ filePath: mdFile })).rejects.toThrow();
  });
});
