import { BrowserWindow, ipcMain, screen } from "electron";
import * as path from "node:path";
import * as fs from "node:fs";
import { logger } from "../adapters/logger";

export class WindowManager {
  private window: BrowserWindow | null = null;
  private isModalOpen = false;

  private resolveIcon(): string | undefined {
    const candidatePaths = [
      path.join(process.cwd(), "resources", "icon.ico"),
      path.join(process.cwd(), "resources", "icon.png"),
      path.join(__dirname, "..", "..", "resources", "icon.ico"),
      path.join(__dirname, "..", "..", "resources", "icon.png"),
      path.join(__dirname, "..", "resources", "icon.ico"),
      path.join(__dirname, "..", "resources", "icon.png"),
      path.join(process.resourcesPath, "resources", "icon.ico"),
      path.join(process.resourcesPath, "resources", "icon.png")
    ];
    return candidatePaths.find((p) => fs.existsSync(p));
  }

  public create(): BrowserWindow {
    const preloadPath = path.join(__dirname, "..", "preload", "preload.js");
    const htmlPath = path.join(__dirname, "..", "renderer", "index.html");
    const iconPath = this.resolveIcon();

    this.window = new BrowserWindow({
      width: 680,
      height: 520,
      show: false,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: false,
      backgroundColor: "#111216",
      icon: iconPath,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });

    this.window.loadFile(htmlPath);

    // Hide on blur unless a modal/dialog inside renderer is open
    this.window.on("blur", () => {
      if (!this.isModalOpen && this.window && this.window.isVisible()) {
        this.hide();
      }
    });

    this.window.on("closed", () => {
      this.window = null;
    });

    ipcMain.handle("window:hide", () => {
      this.hide();
    });

    ipcMain.handle("window:close", () => {
      this.hide();
    });

    ipcMain.on("window:setModalOpen", (_event, isOpen: boolean) => {
      this.isModalOpen = isOpen;
    });

    return this.window;
  }

  public show(): void {
    if (!this.window) {
      this.create();
    }
    if (this.window) {
      this.center();
      this.window.show();
      this.window.focus();
      this.window.webContents.send("window:shown");
    }
  }

  public hide(): void {
    if (this.window && this.window.isVisible()) {
      this.window.hide();
      this.window.webContents.send("window:hidden");
    }
  }

  public toggle(): void {
    if (this.window && this.window.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  private center(): void {
    if (!this.window) return;
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const winBounds = this.window.getBounds();
    const x = Math.round((width - winBounds.width) / 2);
    const y = Math.round((height - winBounds.height) / 2 - 40); // slightly higher than true center for launcher feel
    this.window.setPosition(x, Math.max(y, 50));
  }
}

export const windowManager = new WindowManager();
