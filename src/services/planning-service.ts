import * as fs from "node:fs";
import * as path from "node:path";
import { ConfigService } from "./config-service";
import { chatgptLauncher } from "../adapters/chatgpt-launcher";
import { logger } from "../adapters/logger";
import { AppError } from "../domain/errors";

export class PlanningService {
  constructor(private configService: ConfigService) {}

  public async start(): Promise<{ pasted: boolean; promptCopied: boolean }> {
    const config = this.configService.get();

    // Look for planning-prompt.md in resources or source tree
    const possiblePaths = [
      path.join(__dirname, "..", "..", "resources", "planning-prompt.md"),
      path.join(__dirname, "..", "resources", "planning-prompt.md"),
      path.join(process.cwd(), "resources", "planning-prompt.md")
    ];

    let promptContent = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          promptContent = await fs.promises.readFile(p, "utf8");
          break;
        } catch {
          // Ignore
        }
      }
    }

    if (!promptContent) {
      promptContent = "You are an expert software architect. Help me turn my project idea into an actionable, structured technical specification in Markdown.";
    }

    try {
      logger.info(`Starting ChatGPT planning flow (mode: ${config.chatgptMode})...`);
      const result = await chatgptLauncher.launch(promptContent, config.chatgptMode);
      return {
        pasted: result.pasted,
        promptCopied: true
      };
    } catch (err) {
      logger.error("Failed starting ChatGPT planning", err);
      throw new AppError("CHATGPT_LAUNCH_FAILED", "Failed to launch ChatGPT planning flow.", true, err);
    }
  }
}
