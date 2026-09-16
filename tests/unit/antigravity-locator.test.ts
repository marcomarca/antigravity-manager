import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { AntigravityLocator } from "../../src/adapters/antigravity-locator";

describe("AntigravityLocator", () => {
  const tempDir = path.join(os.tmpdir(), `locator_test_${Date.now()}`);

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("resolves wrapper script in bin/ to parent GUI executable", () => {
    const locator = new AntigravityLocator();
    const fakeInstallDir = path.join(tempDir, "Fake IDE");
    const fakeBinDir = path.join(fakeInstallDir, "bin");
    fs.mkdirSync(fakeBinDir, { recursive: true });

    const fakeExe = path.join(fakeInstallDir, "Antigravity IDE.exe");
    const fakeCmd = path.join(fakeBinDir, "antigravity-ide.cmd");

    fs.writeFileSync(fakeExe, "fake exe");
    fs.writeFileSync(fakeCmd, "@echo off");

    const resolved = locator.resolveBinaryIfScript(fakeCmd);
    expect(resolved).toBe(fakeExe);
  });

  it("returns custom executable directly when it exists", async () => {
    const locator = new AntigravityLocator();
    const customExe = path.join(tempDir, "custom-antigravity.exe");
    fs.writeFileSync(customExe, "binary content");

    const result = await locator.locate(customExe);
    expect(result).toBe(customExe);
  });

  it("locates existing Antigravity IDE executable on the current system", async () => {
    const locator = new AntigravityLocator();
    const result = await locator.locate();
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(fs.existsSync(result)).toBe(true);
    // Must target Antigravity IDE or Code, not Antigravity 2.0 desktop if IDE is present
    expect(result.toLowerCase()).toContain("antigravity");
  });
});
