import { store } from "./state";
import { handleKeyNavigation, handleSearchInput, handleSortChange } from "./search";
import { setupProjectList } from "./components/launcher";
import { setupProjectDetails } from "./components/note-editor";
import { setupNewProjectModal } from "./components/new-project-modal";
import { setupMarkdownDropzones } from "./components/markdown-dropzone";
import { setupCollisionDialog } from "./components/collision-dialog";
import { setupSettingsModal } from "./components/settings-modal";
import type { Project, SortMode } from "../domain/types";

function showToast(message: string): void {
  const toastEl = document.getElementById("toast");
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 2500);
}

async function openProject(project: Project): Promise<void> {
  try {
    await window.app.projects.open(project.path);
    await window.app.window.hide();
  } catch (err: any) {
    showToast(err.message || "Failed to open project in Antigravity.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Get DOM elements
  const searchInput = document.getElementById("search-input") as HTMLInputElement;
  const btnClearSearch = document.getElementById("btn-clear-search") as HTMLButtonElement;
  const sortOrderSelect = document.getElementById("sort-order-select") as HTMLSelectElement;
  const projectsList = document.getElementById("projects-list") as HTMLElement;
  const emptyState = document.getElementById("empty-state") as HTMLElement;

  // Project Details Sidebar elements
  const descView = document.getElementById("project-desc-view") as HTMLElement;
  const descEditWrap = document.getElementById("project-desc-edit-wrap") as HTMLElement;
  const descInput = document.getElementById("project-desc-input") as HTMLTextAreaElement;
  const btnEditDesc = document.getElementById("btn-edit-desc") as HTMLButtonElement;
  const btnSaveDesc = document.getElementById("btn-save-desc") as HTMLButtonElement;
  const btnCancelDesc = document.getElementById("btn-cancel-desc") as HTMLButtonElement;
  const descSavedBadge = document.getElementById("desc-save-indicator") as HTMLElement;

  const noteTextarea = document.getElementById("project-note-input") as HTMLTextAreaElement;
  const noteSavedBadge = document.getElementById("note-save-indicator") as HTMLElement;

  const globalDropzone = document.getElementById("global-dropzone") as HTMLElement;
  const modalDropzone = document.getElementById("modal-dropzone") as HTMLElement;

  const btnNewProject = document.getElementById("btn-new-project") as HTMLButtonElement;
  const btnPlanChatgpt = document.getElementById("btn-plan-chatgpt") as HTMLButtonElement;
  const btnOpenSettings = document.getElementById("btn-open-settings") as HTMLButtonElement;

  // Modals
  const modalNewProject = document.getElementById("modal-new-project") as HTMLElement;
  const newProjectNameInput = document.getElementById("new-project-name") as HTMLInputElement;
  const newProjectError = document.getElementById("new-project-error") as HTMLElement;
  const btnSubmitNewProject = document.getElementById("btn-submit-new-project") as HTMLButtonElement;
  const btnModalChatgpt = document.getElementById("btn-modal-chatgpt") as HTMLButtonElement;
  const btnCloseNewProject = document.getElementById("btn-close-new-project") as HTMLElement;

  const modalCollision = document.getElementById("modal-collision") as HTMLElement;
  const collisionMessage = document.getElementById("collision-message") as HTMLElement;
  const collisionActions = document.getElementById("collision-actions") as HTMLElement;

  const modalSettings = document.getElementById("modal-settings") as HTMLElement;
  const settingsProjectsRoot = document.getElementById("settings-projects-root") as HTMLInputElement;
  const settingsHotkey = document.getElementById("settings-hotkey") as HTMLInputElement;
  const settingsChatgptMode = document.getElementById("settings-chatgpt-mode") as HTMLSelectElement;
  const settingsCustomPrompt = document.getElementById("settings-custom-prompt") as HTMLTextAreaElement;
  const btnResetPrompt = document.getElementById("btn-reset-prompt") as HTMLButtonElement;
  const settingsAntigravityExe = document.getElementById("settings-antigravity-exe") as HTMLInputElement;
  const settingsStartup = document.getElementById("settings-startup") as HTMLInputElement;
  const appVersionDisplay = document.getElementById("app-version-display") as HTMLElement;
  const btnCheckUpdates = document.getElementById("btn-check-updates") as HTMLButtonElement;
  const updateStatusMsg = document.getElementById("update-status-msg") as HTMLElement;
  const btnInstallUpdate = document.getElementById("btn-install-update") as HTMLButtonElement;
  const btnSaveSettings = document.getElementById("btn-save-settings") as HTMLButtonElement;
  const btnCancelSettings = document.getElementById("btn-cancel-settings") as HTMLButtonElement;
  const btnCloseSettings = document.getElementById("btn-close-settings") as HTMLElement;

  // 2. Setup Subcomponents
  setupProjectList(projectsList, emptyState, openProject);
  setupProjectDetails({
    descView,
    descEditWrap,
    descInput,
    btnEditDesc,
    btnSaveDesc,
    btnCancelDesc,
    descSavedBadge,
    noteTextarea,
    noteSavedBadge
  });
  setupMarkdownDropzones(globalDropzone, modalDropzone, showToast);
  setupNewProjectModal(
    modalNewProject,
    newProjectNameInput,
    newProjectError,
    btnSubmitNewProject,
    btnModalChatgpt,
    btnCloseNewProject,
    showToast
  );
  setupCollisionDialog(modalCollision, collisionMessage, collisionActions, () => {}, showToast);
  setupSettingsModal({
    modal: modalSettings,
    projectsRootInput: settingsProjectsRoot,
    hotkeyInput: settingsHotkey,
    chatgptModeSelect: settingsChatgptMode,
    customPromptTextarea: settingsCustomPrompt,
    resetPromptBtn: btnResetPrompt,
    antigravityExeInput: settingsAntigravityExe,
    startupCheckbox: settingsStartup,
    appVersionDisplay,
    btnCheckUpdates,
    updateStatusMsg,
    btnInstallUpdate,
    saveBtn: btnSaveSettings,
    cancelBtn: btnCancelSettings,
    closeBtn: btnCloseSettings,
    showToast
  });

  // 3. Search and Input Listeners
  const clearSearch = (): void => {
    searchInput.value = "";
    btnClearSearch.classList.add("hidden");
    handleSearchInput("");
    searchInput.focus();
  };

  searchInput.addEventListener("input", () => {
    const val = searchInput.value;
    btnClearSearch.classList.toggle("hidden", val.length === 0);
    handleSearchInput(val);
  });

  btnClearSearch.addEventListener("click", () => {
    clearSearch();
  });

  sortOrderSelect.addEventListener("change", () => {
    handleSortChange(sortOrderSelect.value as SortMode);
  });

  // Global Keyboard Routing
  window.addEventListener("keydown", (e) => {
    handleKeyNavigation(e, {
      openSelected: () => {
        const { selectedProject } = store.getState();
        if (selectedProject) openProject(selectedProject);
      },
      openNewProject: () => {
        store.setState({ activeModal: "new_project" });
      },
      openSettings: () => {
        store.setState({ activeModal: "settings" });
      },
      closeOrHide: async () => {
        await window.app.window.hide();
      },
      focusDescription: () => {
        if (descEditWrap && !descEditWrap.classList.contains("hidden")) {
          descInput.focus();
          descInput.select();
        } else if (btnEditDesc && !btnEditDesc.disabled) {
          btnEditDesc.focus();
        } else if (!noteTextarea.disabled) {
          noteTextarea.focus();
          noteTextarea.setSelectionRange(noteTextarea.value.length, noteTextarea.value.length);
        }
      },
      focusNote: () => {
        if (!noteTextarea.disabled) {
          noteTextarea.focus();
          noteTextarea.setSelectionRange(noteTextarea.value.length, noteTextarea.value.length);
        }
      },
      focusSearch: () => {
        searchInput.focus();
        searchInput.select();
      },
      clearSearch: () => {
        clearSearch();
      }
    });
  });

  // Bottom Buttons
  btnNewProject.addEventListener("click", () => {
    store.setState({ activeModal: "new_project" });
  });

  btnPlanChatgpt.addEventListener("click", async () => {
    try {
      showToast("Starting ChatGPT planning flow...");
      const res = await window.app.planning.start();
      if (res.pasted) {
        showToast("ChatGPT opened and prompt pasted!");
      } else {
        showToast("Prompt copied to clipboard. Paste into ChatGPT!");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to launch ChatGPT.");
    }
  });

  btnOpenSettings.addEventListener("click", () => {
    store.setState({ activeModal: "settings" });
  });

  // 4. Initial Data Fetch
  async function refreshData(): Promise<void> {
    try {
      const [projects, config] = await Promise.all([
        window.app.projects.list(),
        window.app.settings.get()
      ]);
      const currentSortMode = store.getState().sortMode || config.defaultSortMode || "recent";
      sortOrderSelect.value = currentSortMode;
      store.setState({ projects, config, sortMode: currentSortMode });
      handleSearchInput(searchInput.value, currentSortMode);
    } catch (err) {
      console.error("Failed loading launcher data:", err);
    }
  }

  await refreshData();
  searchInput.focus();

  // Listen for window shown events to refresh recent projects and refocus search
  if (window.app.window.onShown) {
    window.app.window.onShown(async () => {
      await refreshData();
      searchInput.focus();
      searchInput.select();
    });
  }

  // Listen for tray context menu direct actions
  if (window.app.tray?.onNewProject) {
    window.app.tray.onNewProject(() => {
      store.setState({ activeModal: "new_project" });
    });
  }

  if (window.app.tray?.onSettings) {
    window.app.tray.onSettings(() => {
      store.setState({ activeModal: "settings" });
    });
  }
});
