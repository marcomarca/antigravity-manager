import { store } from "../state";
import type { ChatGPTMode } from "../../domain/types";

export function setupSettingsModal(
  modal: HTMLElement,
  projectsRootInput: HTMLInputElement,
  hotkeyInput: HTMLInputElement,
  chatgptModeSelect: HTMLSelectElement,
  antigravityExeInput: HTMLInputElement,
  startupCheckbox: HTMLInputElement,
  saveBtn: HTMLButtonElement,
  cancelBtn: HTMLButtonElement,
  closeBtn: HTMLElement,
  showToast: (msg: string) => void
): void {
  store.subscribe(() => {
    const { activeModal, config } = store.getState();
    if (activeModal === "settings") {
      modal.classList.remove("hidden");
      if (config) {
        projectsRootInput.value = config.projectsRoot || "";
        hotkeyInput.value = config.hotkey || "Ctrl+Alt+Space";
        chatgptModeSelect.value = config.chatgptMode || "auto";
        antigravityExeInput.value = config.antigravityExecutable || "";
        startupCheckbox.checked = config.launchAtStartup !== false;
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

  saveBtn.addEventListener("click", async () => {
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      const updated = await window.app.settings.update({
        projectsRoot: projectsRootInput.value.trim(),
        hotkey: hotkeyInput.value.trim() || "Ctrl+Alt+Space",
        chatgptMode: chatgptModeSelect.value as ChatGPTMode,
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
