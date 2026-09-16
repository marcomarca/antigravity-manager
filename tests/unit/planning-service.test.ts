import { describe, expect, it } from "bun:test";
import { ConfigService } from "../../src/services/config-service";
import { PlanningService } from "../../src/services/planning-service";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

describe("PlanningService", () => {
  const tempDir = path.join(os.tmpdir(), `test_planning_${Date.now()}`);

  it("returns default prompt template when no custom prompt is defined", async () => {
    fs.mkdirSync(tempDir, { recursive: true });
    const configService = new ConfigService(tempDir);
    await configService.init();

    const planningService = new PlanningService(configService);
    const activePrompt = await planningService.getActivePrompt();
    expect(activePrompt).toBeDefined();
    expect(activePrompt.length).toBeGreaterThan(10);
  });

  it("returns and uses custom planning prompt when configured in AppData config", async () => {
    const configService = new ConfigService(tempDir);
    await configService.init();

    const customText = "My Custom Architecture Prompt for AI Agents: Step 1, Step 2.";
    await configService.update({ customPlanningPrompt: customText });

    const planningService = new PlanningService(configService);
    const activePrompt = await planningService.getActivePrompt();
    expect(activePrompt).toBe(customText);

    // Verify fallback when cleared to empty string
    await configService.update({ customPlanningPrompt: "" });
    const fallbackPrompt = await planningService.getActivePrompt();
    const defaultPrompt = await planningService.getDefaultPrompt();
    expect(fallbackPrompt).toBe(defaultPrompt);

    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });
});
