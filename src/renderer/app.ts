import { store } from "./state";
import { handleClearTags, handleKeyNavigation, handleSearchInput, handleSortChange, handleTagToggle } from "./search";
import { getUniqueTagsWithCounts } from "../domain/search-ranker";
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

  // Tag filter elements
  const btnTagFilter = document.getElementById("btn-tag-filter") as HTMLButtonElement;
  const tagFilterBadge = document.getElementById("tag-filter-badge") as HTMLElement;
  const tagsFilterMenu = document.getElementById("tags-filter-menu") as HTMLElement;
  const tagsFilterList = document.getElementById("tags-filter-list") as HTMLElement;
  const btnClearTagsMenu = document.getElementById("btn-clear-tags-menu") as HTMLButtonElement;

  // Active tags bar elements
  const activeTagsBar = document.getElementById("active-tags-bar") as HTMLElement;
  const activeTagsChips = document.getElementById("active-tags-chips") as HTMLElement;
  const btnClearAllTags = document.getElementById("btn-clear-all-tags") as HTMLButtonElement;

  // Custom Context Menu elements
  const projectContextMenu = document.getElementById("project-context-menu") as HTMLElement;
  const ctxItemPin = document.getElementById("ctx-item-pin") as HTMLButtonElement;
  const ctxPinIcon = document.getElementById("ctx-pin-icon") as HTMLElement;
  const ctxPinLabel = document.getElementById("ctx-pin-label") as HTMLElement;
  const ctxPinShortcut = document.getElementById("ctx-pin-shortcut") as HTMLElement;
  const ctxItemExplorer = document.getElementById("ctx-item-explorer") as HTMLButtonElement;
  const ctxFolderShortcut = document.getElementById("ctx-folder-shortcut") as HTMLElement;
  const ctxItemCopy = document.getElementById("ctx-item-copy") as HTMLButtonElement;
  const ctxCopyShortcut = document.getElementById("ctx-copy-shortcut") as HTMLElement;

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
  const settingsPinShortcut = document.getElementById("settings-pin-shortcut") as HTMLInputElement;
  const settingsOpenFolderShortcut = document.getElementById("settings-open-folder-shortcut") as HTMLInputElement;
  const settingsCopyPathShortcut = document.getElementById("settings-copy-path-shortcut") as HTMLInputElement;
  const btnResetHotkey = document.getElementById("btn-reset-hotkey") as HTMLButtonElement | null;
  const btnResetPinShortcut = document.getElementById("btn-reset-pin-shortcut") as HTMLButtonElement | null;
  const btnResetOpenFolderShortcut = document.getElementById("btn-reset-open-folder-shortcut") as HTMLButtonElement | null;
  const btnResetCopyPathShortcut = document.getElementById("btn-reset-copy-path-shortcut") as HTMLButtonElement | null;
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

  // 2. Setup Actions & Handlers
  let contextMenuTarget: Project | null = null;

  const closeContextMenu = () => {
    projectContextMenu.classList.add("hidden");
    contextMenuTarget = null;
  };

  const openContextMenu = (proj: Project, x: number, y: number) => {
    contextMenuTarget = proj;
    const config = store.getState().config;

    ctxPinLabel.textContent = proj.pinned ? "Desfijar proyecto" : "Fijar proyecto";
    ctxPinIcon.textContent = proj.pinned ? "📌" : "📌";
    ctxPinShortcut.textContent = config?.pinShortcut || "Ctrl+Shift+P";
    ctxFolderShortcut.textContent = config?.openFolderShortcut || "Ctrl+Shift+S";
    ctxCopyShortcut.textContent = config?.copyPathShortcut || "Ctrl+Shift+C";

    // Constrain position within window boundaries
    const maxX = window.innerWidth - 230;
    const maxY = window.innerHeight - 140;
    projectContextMenu.style.left = `${Math.max(10, Math.min(x, maxX))}px`;
    projectContextMenu.style.top = `${Math.max(10, Math.min(y, maxY))}px`;
    projectContextMenu.classList.remove("hidden");
  };

  const togglePin = async (proj?: Project): Promise<void> => {
    const target = proj || store.getState().selectedProject;
    if (!target) return;

    try {
      const newPinned = !target.pinned;
      await window.app.projects.setPinned(target.path, newPinned);
      target.pinned = newPinned;

      const { projects, searchQuery, sortMode } = store.getState();
      const updatedProjects = [...projects];
      store.setState({ projects: updatedProjects });
      handleSearchInput(searchQuery, sortMode);

      showToast(newPinned ? "Proyecto fijado arriba" : "Proyecto desfijado");
    } catch (err: any) {
      showToast(err.message || "Failed to update pinned status");
    }
  };

  const openFolder = async (proj?: Project): Promise<void> => {
    const target = proj || store.getState().selectedProject;
    if (!target) return;

    try {
      await window.app.projects.openFolder(target.path);
      showToast("Carpeta abierta en el Explorador");
    } catch (err: any) {
      showToast(err.message || "Failed to open folder");
    }
  };

  const copyPath = async (proj?: Project): Promise<void> => {
    const target = proj || store.getState().selectedProject;
    if (!target) return;

    try {
      await window.app.projects.copyPath(target.path);
      showToast("Ruta copiada al portapapeles");
    } catch (err: any) {
      showToast(err.message || "Failed to copy path");
    }
  };

  // Context menu item click handlers
  ctxItemPin.addEventListener("click", () => {
    const target = contextMenuTarget;
    closeContextMenu();
    if (target) togglePin(target);
  });

  ctxItemExplorer.addEventListener("click", () => {
    const target = contextMenuTarget;
    closeContextMenu();
    if (target) openFolder(target);
  });

  ctxItemCopy.addEventListener("click", () => {
    const target = contextMenuTarget;
    closeContextMenu();
    if (target) copyPath(target);
  });

  // Global dismiss context menu on click outside
  document.addEventListener("click", (e) => {
    if (!projectContextMenu.classList.contains("hidden")) {
      const clickedInside = projectContextMenu.contains(e.target as Node);
      if (!clickedInside) {
        closeContextMenu();
      }
    }
    if (!tagsFilterMenu.classList.contains("hidden")) {
      const clickedTagFilter =
        btnTagFilter.contains(e.target as Node) || tagsFilterMenu.contains(e.target as Node);
      if (!clickedTagFilter) {
        tagsFilterMenu.classList.add("hidden");
      }
    }
  });

  // Tag Filter UI rendering
  const renderTagsFilterMenu = () => {
    const { projects, selectedTags } = store.getState();
    const uniqueTags = getUniqueTagsWithCounts(projects);

    tagsFilterList.innerHTML = "";

    if (uniqueTags.length === 0) {
      tagsFilterList.innerHTML = `<div class="tags-filter-empty">No hay etiquetas creadas aún</div>`;
      btnClearTagsMenu.classList.add("hidden");
      return;
    }

    btnClearTagsMenu.classList.toggle("hidden", selectedTags.length === 0);

    uniqueTags.forEach(({ tag, count }) => {
      const isSelected = selectedTags.includes(tag.toLowerCase());
      const item = document.createElement("div");
      item.className = `tags-filter-item ${isSelected ? "selected" : ""}`;
      item.setAttribute("role", "menuitemcheckbox");
      item.setAttribute("aria-checked", isSelected ? "true" : "false");

      item.innerHTML = `
        <input type="checkbox" class="tags-filter-checkbox" ${isSelected ? "checked" : ""} />
        <span class="tags-filter-item-name">#${tag}</span>
        <span class="tags-filter-item-count">${count}</span>
      `;

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        handleTagToggle(tag);
        renderTagsFilterMenu();
      });

      tagsFilterList.appendChild(item);
    });
  };

  const renderActiveTagsBar = () => {
    const { selectedTags } = store.getState();

    if (selectedTags.length > 0) {
      tagFilterBadge.textContent = String(selectedTags.length);
      tagFilterBadge.classList.remove("hidden");
      btnTagFilter.classList.add("active");

      activeTagsBar.classList.remove("hidden");
      activeTagsChips.innerHTML = "";

      selectedTags.forEach((tag) => {
        const chip = document.createElement("span");
        chip.className = "active-tag-chip";
        chip.title = `Eliminar filtro #${tag}`;
        chip.innerHTML = `<span>#${tag}</span><span class="active-tag-remove">✕</span>`;

        chip.addEventListener("click", () => {
          handleTagToggle(tag);
        });

        activeTagsChips.appendChild(chip);
      });
    } else {
      tagFilterBadge.classList.add("hidden");
      btnTagFilter.classList.remove("active");
      activeTagsBar.classList.add("hidden");
      activeTagsChips.innerHTML = "";
    }
  };

  btnTagFilter.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = tagsFilterMenu.classList.contains("hidden");
    if (isHidden) {
      renderTagsFilterMenu();
      tagsFilterMenu.classList.remove("hidden");
    } else {
      tagsFilterMenu.classList.add("hidden");
    }
  });

  btnClearTagsMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    handleClearTags();
    renderTagsFilterMenu();
  });

  btnClearAllTags.addEventListener("click", () => {
    handleClearTags();
  });

  // Subscribe to tag updates and modal state
  let prevTags: string[] = [];
  let prevActiveModal: string = store.getState().activeModal;
  store.subscribe(() => {
    const { selectedTags, activeModal } = store.getState();
    if (selectedTags !== prevTags) {
      prevTags = selectedTags;
      renderActiveTagsBar();
    }
    if (activeModal !== prevActiveModal) {
      prevActiveModal = activeModal;
      if (window.app.window?.setModalOpen) {
        window.app.window.setModalOpen(activeModal !== "none");
      }
    }
  });

  // 3. Setup Project List and Details
  setupProjectList(
    projectsList,
    emptyState,
    openProject,
    (proj, e) => {
      openContextMenu(proj, e.clientX, e.clientY);
    },
    (tag) => {
      handleTagToggle(tag);
    }
  );

  setupProjectDetails({
    descView,
    descEditWrap,
    descInput,
    btnEditDesc,
    btnSaveDesc,
    btnCancelDesc,
    descSavedBadge,
    tagsList: document.getElementById("project-tags-list") as HTMLElement,
    inputNewTag: document.getElementById("input-new-tag") as HTMLInputElement,
    tagSavedBadge: document.getElementById("tag-save-indicator") as HTMLElement,
    noteTextarea,
    noteSavedBadge,
    onTagClick: (tag) => handleTagToggle(tag)
  });
  const dropzonesController = setupMarkdownDropzones(globalDropzone, modalDropzone, showToast);
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
    pinShortcutInput: settingsPinShortcut,
    openFolderShortcutInput: settingsOpenFolderShortcut,
    copyPathShortcutInput: settingsCopyPathShortcut,
    resetHotkeyBtn: btnResetHotkey,
    resetPinShortcutBtn: btnResetPinShortcut,
    resetOpenFolderShortcutBtn: btnResetOpenFolderShortcut,
    resetCopyPathShortcutBtn: btnResetCopyPathShortcut,
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
    // If context menu is visible, let Escape or arrow keys/enter interact with it
    if (!projectContextMenu.classList.contains("hidden")) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeContextMenu();
        return;
      }
    }

    handleKeyNavigation(e, {
      openSelected: () => {
        const { selectedProject } = store.getState();
        if (selectedProject) openProject(selectedProject);
      },
      openFolder: () => {
        openFolder();
      },
      copyPath: () => {
        copyPath();
      },
      togglePin: () => {
        togglePin();
      },
      openContextMenu: () => {
        const { selectedProject } = store.getState();
        if (!selectedProject) return;
        const selectedEl = document.querySelector(".project-row.selected") as HTMLElement | null;
        const rect = selectedEl?.getBoundingClientRect();
        const x = rect ? rect.right - 220 : 100;
        const y = rect ? rect.bottom : 100;
        openContextMenu(selectedProject, x, y);
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
      focusTags: () => {
        const inputNewTag = document.getElementById("input-new-tag") as HTMLInputElement | null;
        if (inputNewTag && !inputNewTag.disabled) {
          inputNewTag.focus();
          inputNewTag.select();
        } else if (!noteTextarea.disabled) {
          noteTextarea.focus();
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
      },
      dismissDropzone: () => {
        if (dropzonesController.isVisible()) {
          dropzonesController.hide();
          return true;
        }
        return false;
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
      dropzonesController.reset();
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
