import { exec } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "./logger";

const execAsync = promisify(exec);

export class WindowsAutomation {
  /**
   * Gets the window title of the current foreground window on Windows
   */
  public async getForegroundWindowTitle(): Promise<string> {
    if (process.platform !== "win32") {
      return "";
    }

    const script = `
Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  using System.Text;
  public class WinApi {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll", CharSet=CharSet.Auto, SetLastError=true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  }
"@
$hwnd = [WinApi]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 256
[void][WinApi]::GetWindowText($hwnd, $sb, 256)
$sb.ToString()
`;

    try {
      const encoded = Buffer.from(script, "utf16le").toString("base64");
      const { stdout } = await execAsync(`powershell -NoProfile -EncodedCommand ${encoded}`, { timeout: 2000 });
      return stdout.trim();
    } catch (err) {
      logger.warn("Failed retrieving foreground window title", err);
      return "";
    }
  }

  /**
   * Safely sends Ctrl+V keypress only if target title matches criteria
   */
  public async sendPasteIfWindowMatches(expectedSubstring: string): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }

    try {
      const title = await this.getForegroundWindowTitle();
      logger.info(`Checking active window for paste. Current title: "${title}"`);

      if (!title.toLowerCase().includes(expectedSubstring.toLowerCase())) {
        logger.info(`Foreground window "${title}" does not match "${expectedSubstring}". Skipping auto-paste.`);
        return false;
      }

      // Send Ctrl+V using SendKeys
      const sendKeysScript = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait("^v")
`;
      const encoded = Buffer.from(sendKeysScript, "utf16le").toString("base64");
      await execAsync(`powershell -NoProfile -EncodedCommand ${encoded}`, { timeout: 2000 });
      logger.info("Successfully sent Ctrl+V to ChatGPT window.");
      return true;
    } catch (err) {
      logger.warn("Failed executing safe paste keypress", err);
      return false;
    }
  }
}

export const windowsAutomation = new WindowsAutomation();
