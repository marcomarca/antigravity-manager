import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { ConfigService } from "../../src/services/config-service";

describe("ConfigService", () => {
  const tempDir = path.join(os.tmpdir(), `launcher_test_config_${Date.now()}`);

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("initializes with default settings when file does not exist", async () => {
    const service = new ConfigService(tempDir);
    const config = await service.init();

    expect(config.version).toBe(1);
    expect(config.hotkey).toBe("Ctrl+Alt+Space");
    expect(config.launchAtStartup).toBe(true);
    expect(config.chatgptMode).toBe("auto");
    expect(fs.existsSync(service.getConfigPath())).toBe(true);
  });

  it("updates and atomically saves settings", async () => {
    const service = new ConfigService(tempDir);
    await service.init();

    await service.update({
      hotkey: "Ctrl+Shift+P",
      chatgptMode: "web"
    });

    const reloadedService = new ConfigService(tempDir);
    const reloadedConfig = await reloadedService.init();

    expect(reloadedConfig.hotkey).toBe("Ctrl+Shift+P");
    expect(reloadedConfig.chatgptMode).toBe("web");
  });
});
