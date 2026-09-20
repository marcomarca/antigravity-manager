import { store } from "../state";
import type { ChatGPTMode } from "../../domain/types";
import { setupShortcutRecorder } from "../utils/shortcut-recorder";

export interface SettingsModalElements {
  modal: HTMLElement;
  projectsRootInput: HTMLInputElement;
  hotkeyInput: HTMLInputElement;
  pinShortcutInput: HTMLInputElement;
  openFolderShortcutInput: HTMLInputElement;
  copyPathShortcutInput: HTMLInputElement;
  resetHotkeyBtn?: HTMLButtonElement | null;
  resetPinShortcutBtn?: HTMLButtonElement | null;
  resetOpenFolderShortcutBtn?: HTMLButtonElement | null;
  resetCopyPathShortcutBtn?: HTMLButtonElement | null;
  chatgptModeSelect: HTMLSelectElement;
  customPromptTextarea: HTMLTextAreaElement;
  resetPromptBtn: HTMLButtonElement;
  antigravityExeInput: HTMLInputElement;
  startupCheckbox: HTMLInputElement;
  appVersionDisplay: HTMLElement;
  btnCheckUpdates: HTMLButtonElement;
  updateStatusMsg: HTMLElement;
  btnInstallUpdate: HTMLButtonElement;
  saveBtn: HTMLButtonElement;
  cancelBtn: HTMLButtonElement;
  closeBtn: HTMLElement;
  showToast: (msg: string) => void;
}

export function setupSettingsModal(elements: SettingsModalElements): void {
  const {
    modal,
    projectsRootInput,
    hotkeyInput,
    pinShortcutInput,
    openFolderShortcutInput,
    copyPathShortcutInput,
    resetHotkeyBtn,
    resetPinShortcutBtn,
    resetOpenFolderShortcutBtn,
    resetCopyPathShortcutBtn,
    chatgptModeSelect,
    customPromptTextarea,
    resetPromptBtn,
    antigravityExeInput,
    startupCheckbox,
    appVersionDisplay,
    btnCheckUpdates,
    updateStatusMsg,
    btnInstallUpdate,
    saveBtn,
    cancelBtn,
    closeBtn,
    showToast
  } = elements;

  // Initialize interactive shortcut recorders with default values and reset buttons
  setupShortcutRecorder(hotkeyInput, {
    defaultValue: "Ctrl+Alt+Space",
    resetBtn: resetHotkeyBtn
  });

  setupShortcutRecorder(pinShortcutInput, {
    defaultValue: "Ctrl+Shift+P",
    resetBtn: resetPinShortcutBtn
  });

  setupShortcutRecorder(openFolderShortcutInput, {
    defaultValue: "Ctrl+Shift+S",
    resetBtn: resetOpenFolderShortcutBtn
  });

  setupShortcutRecorder(copyPathShortcutInput, {
    defaultValue: "Ctrl+Shift+C",
    resetBtn: resetCopyPathShortcutBtn
  });

  const renderUpdateStatus = (status: { state: string; version?: string; percent?: number; message?: string }) => {
    if (!status) return;

    updateStatusMsg.classList.remove("error", "success", "info");

    switch (status.state) {
      case "checking":
        updateStatusMsg.classList.remove("hidden");
        updateStatusMsg.classList.add("info");
        updateStatusMsg.textContent = "Checking for updates...";
        btnCheckUpdates.disabled = true;
        btnInstallUpdate.classList.add("hidden");
        break;
      case "available":
        updateStatusMsg.classList.remove("hidden");
        updateStatusMsg.classList.add("info");
        updateStatusMsg.textContent = `New version v${status.version || ""} found. Downloading...`;
        btnCheckUpdates.disabled = true;
        btnInstallUpdate.classList.add("hidden");
        break;
      case "downloading":
        updateStatusMsg.classList.remove("hidden");
        updateStatusMsg.classList.add("info");
        updateStatusMsg.textContent = `Downloading update: ${status.percent || 0}%`;
        btnCheckUpdates.disabled = true;
        btnInstallUpdate.classList.add("hidden");
        break;
      case "downloaded":
        updateStatusMsg.classList.remove("hidden");
        updateStatusMsg.classList.add("success");
        updateStatusMsg.textContent = `Version v${status.version || ""} is ready to install.`;
        btnInstallUpdate.classList.remove("hidden");
        btnCheckUpdates.disabled = false;
        break;
      case "not-available":
        updateStatusMsg.classList.remove("hidden");
        updateStatusMsg.classList.add("success");
        updateStatusMsg.textContent = "You are on the latest version.";
        btnCheckUpdates.disabled = false;
        btnInstallUpdate.classList.add("hidden");
        break;
      case "error":
        updateStatusMsg.classList.remove("hidden");
        updateStatusMsg.classList.add("error");
        updateStatusMsg.textContent = status.message || "Failed checking for updates.";
        btnCheckUpdates.disabled = false;
        btnInstallUpdate.classList.add("hidden");
        break;
      default:
        updateStatusMsg.classList.add("hidden");
        btnInstallUpdate.classList.add("hidden");
        btnCheckUpdates.disabled = false;
        break;
    }
  };

  // Listen for auto-updater status broadcasts
  if (window.app.updater?.onStatusChange) {
    window.app.updater.onStatusChange((status) => {
      renderUpdateStatus(status);
      if (status.state === "downloaded") {
        showToast(`Update v${status.version || ""} downloaded! Restart to apply.`);
      }
    });
  }

  // Fetch initial version
  if (window.app.updater?.getVersion) {
    window.app.updater.getVersion().then((ver) => {
      appVersionDisplay.textContent = `v${ver}`;
    }).catch(() => {});
  }

  btnCheckUpdates.addEventListener("click", async () => {
    try {
      btnCheckUpdates.disabled = true;
      updateStatusMsg.classList.remove("hidden", "error", "success");
      updateStatusMsg.classList.add("info");
      updateStatusMsg.textContent = "Checking GitHub Releases...";
      const res = await window.app.updater.checkForUpdates();
      if (!res.success && res.message) {
        updateStatusMsg.classList.add("error");
        updateStatusMsg.textContent = res.message;
      }
    } catch (err: any) {
      updateStatusMsg.classList.add("error");
      updateStatusMsg.textContent = err.message || "Failed to check for updates.";
    } finally {
      btnCheckUpdates.disabled = false;
    }
  });

  btnInstallUpdate.addEventListener("click", () => {
    window.app.updater.quitAndInstall();
  });

  store.subscribe(() => {
    const { activeModal, config } = store.getState();
    if (activeModal === "settings") {
      modal.classList.remove("hidden");
      if (config) {
        projectsRootInput.value = config.projectsRoot || "";
        hotkeyInput.value = config.hotkey || "Ctrl+Alt+Space";
        pinShortcutInput.value = config.pinShortcut || "Ctrl+Shift+P";
        openFolderShortcutInput.value = config.openFolderShortcut || "Ctrl+Shift+S";
        copyPathShortcutInput.value = config.copyPathShortcut || "Ctrl+Shift+C";
        chatgptModeSelect.value = config.chatgptMode || "auto";
        customPromptTextarea.value = config.customPlanningPrompt || "";
        antigravityExeInput.value = config.antigravityExecutable || "";
        startupCheckbox.checked = config.launchAtStartup !== false;
      }

      // Refresh current update status
      if (window.app.updater?.getStatus) {
        window.app.updater.getStatus().then((st) => renderUpdateStatus(st)).catch(() => {});
      }
    } else {
      modal.classList.add("hidden");
    }
  });

  const closeModal = () => {
    store.setState({ activeModal: "none" });
  };

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  resetPromptBtn.addEventListener("click", async () => {
    try {
      const defaultPrompt = await window.app.planning.getDefaultPrompt();
      customPromptTextarea.value = defaultPrompt;
      showToast("Default planning prompt loaded.");
    } catch {
      showToast("Could not load default prompt template.");
    }
  });

  saveBtn.addEventListener("click", async () => {
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      const promptVal = customPromptTextarea.value.trim();

      const updated = await window.app.settings.update({
        projectsRoot: projectsRootInput.value.trim(),
        hotkey: hotkeyInput.value.trim() || "Ctrl+Alt+Space",
        pinShortcut: pinShortcutInput.value.trim() || "Ctrl+Shift+P",
        openFolderShortcut: openFolderShortcutInput.value.trim() || "Ctrl+Shift+S",
        copyPathShortcut: copyPathShortcutInput.value.trim() || "Ctrl+Shift+C",
        chatgptMode: chatgptModeSelect.value as ChatGPTMode,
        customPlanningPrompt: promptVal.length > 0 ? promptVal : undefined,
        antigravityExecutable: antigravityExeInput.value.trim() || null,
        launchAtStartup: startupCheckbox.checked
      });

      store.setState({ config: updated, activeModal: "none" });
      showToast("Settings saved successfully.");

      // Refresh projects list with new root
      const projects = await window.app.projects.list();
      store.setState({ projects });
    } catch (err: any) {
      showToast(err.message || "Failed to update settings.");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Settings";
    }
  });
}
