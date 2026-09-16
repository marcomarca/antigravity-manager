import { Menu, Tray, app, nativeImage, type NativeImage } from "electron";
import * as path from "node:path";
import * as fs from "node:fs";
import { windowManager } from "./window";

export class TrayManager {
  private tray: Tray | null = null;

  public init(onNewProject?: () => void, onSettings?: () => void): Tray {
    const candidatePaths = [
      path.join(process.cwd(), "resources", "tray-icon.ico"),
      path.join(process.cwd(), "resources", "tray-icon.png"),
      path.join(process.cwd(), "resources", "icon.ico"),
      path.join(process.cwd(), "resources", "icon.png"),
      path.join(app.getAppPath(), "resources", "tray-icon.ico"),
      path.join(app.getAppPath(), "resources", "tray-icon.png"),
      path.join(app.getAppPath(), "resources", "icon.ico"),
      path.join(app.getAppPath(), "resources", "icon.png"),
      path.join(__dirname, "..", "..", "resources", "tray-icon.ico"),
      path.join(__dirname, "..", "..", "resources", "tray-icon.png"),
      path.join(__dirname, "..", "..", "resources", "icon.ico"),
      path.join(__dirname, "..", "..", "resources", "icon.png"),
      path.join(__dirname, "..", "resources", "tray-icon.ico"),
      path.join(__dirname, "..", "resources", "tray-icon.png"),
      path.join(__dirname, "..", "resources", "icon.ico"),
      path.join(__dirname, "..", "resources", "icon.png"),
      path.join(process.resourcesPath, "resources", "tray-icon.ico"),
      path.join(process.resourcesPath, "resources", "tray-icon.png"),
      path.join(process.resourcesPath, "resources", "icon.ico"),
      path.join(process.resourcesPath, "resources", "icon.png")
    ];

    let icon: NativeImage = nativeImage.createEmpty();
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const loaded = nativeImage.createFromPath(p);
        if (!loaded.isEmpty()) {
          icon = loaded;
          break;
        }
      }
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip("Antigravity Project Launcher");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Open Launcher",
        click: () => {
          windowManager.show();
        }
      },
      {
        label: "New Project",
        click: () => {
          windowManager.show();
          if (onNewProject) onNewProject();
          else {
            const win = windowManager.getWindow();
            win?.webContents.send("tray:newProject");
          }
        }
      },
      {
        label: "Settings",
        click: () => {
          windowManager.show();
          if (onSettings) onSettings();
          else {
            const win = windowManager.getWindow();
            win?.webContents.send("tray:settings");
          }
        }
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);

    this.tray.on("click", () => {
      windowManager.toggle();
    });

    return this.tray;
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

export const trayManager = new TrayManager();
