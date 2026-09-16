import { app } from "electron";
import { ConfigService } from "../services/config-service";
import { MetadataService } from "../services/metadata-service";
import { DiscoveryService } from "../services/discovery-service";
import { ProjectService } from "../services/project-service";
import { PlanningService } from "../services/planning-service";
import { registerProjectsIpc } from "./ipc/projects-ipc";
import { registerPlanningIpc } from "./ipc/planning-ipc";
import { registerSettingsIpc } from "./ipc/settings-ipc";
import { windowManager } from "./window";
import { hotkeyManager } from "./hotkeys";
import { trayManager } from "./tray";
import { logger } from "../adapters/logger";
import type { Config } from "../domain/types";

// 1. Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  logger.warn("Another instance is already running. Quitting.");
  app.quit();
} else {
  app.on("second-instance", () => {
    logger.info("Second instance detected, focusing launcher.");
    windowManager.show();
  });

  // 2. Instantiate core services
  const configService = new ConfigService();
  const metadataService = new MetadataService();
  const discoveryService = new DiscoveryService(configService, metadataService);
  const projectService = new ProjectService(configService, metadataService);
  const planningService = new PlanningService(configService);

  const applyConfig = (config: Config) => {
    // Update startup setting
    try {
      app.setLoginItemSettings({
        openAtLogin: config.launchAtStartup,
        args: ["--hidden"]
      });
    } catch (err) {
      logger.warn("Could not set login item settings", err);
    }

    // Register hotkey
    if (config.hotkey) {
      hotkeyManager.register(config.hotkey);
    }
  };

  app.whenReady().then(async () => {
    logger.info("Application starting up...");

    // Initialize persisted services
    const config = await configService.init();
    await metadataService.init();

    // Register IPC channels
    registerProjectsIpc(discoveryService, projectService, metadataService);
    registerPlanningIpc(planningService);
    registerSettingsIpc(configService, (newConfig) => {
      applyConfig(newConfig);
    });

    // Create main launcher window
    windowManager.create();

    // Setup system tray
    trayManager.init();

    // Apply configuration (hotkeys, startup)
    applyConfig(config);

    // If started with --hidden or from Windows startup, stay in background
    const isHidden = process.argv.includes("--hidden");
    if (!isHidden) {
      windowManager.show();
    } else {
      logger.info("Started in background mode (--hidden).");
    }
  });

  app.on("will-quit", () => {
    hotkeyManager.unregisterAll();
    trayManager.destroy();
    logger.info("Application exiting.");
  });

  // Windows-specific: Prevent app quitting when all windows are closed (stay in tray)
  app.on("window-all-closed", () => {
    // Keep running in tray
  });
}
