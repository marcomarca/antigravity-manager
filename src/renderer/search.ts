import { filterAndRankProjects } from "../domain/search-ranker";
import type { SortMode } from "../domain/types";
import { store } from "./state";

export interface KeyNavigationActions {
  openSelected: () => void;
  openNewProject: () => void;
  openSettings: () => void;
  closeOrHide: () => void;
  openFolder?: () => void;
  copyPath?: () => void;
  togglePin?: () => void;
  openContextMenu?: () => void;
  focusDescription?: () => void;
  focusTags?: () => void;
  focusNote?: () => void;
  focusSearch?: () => void;
  clearSearch?: () => void;
  dismissDropzone?: () => boolean;
}

export function matchesShortcut(e: KeyboardEvent, shortcutStr?: string): boolean {
  if (!shortcutStr) return false;
  const parts = shortcutStr.split("+").map((p) => p.trim().toLowerCase());
  const requiresCtrl = parts.includes("ctrl");
  const requiresShift = parts.includes("shift");
  const requiresAlt = parts.includes("alt");
  const baseKey = parts.find((p) => p !== "ctrl" && p !== "shift" && p !== "alt");

  const hasCtrl = Boolean(e.ctrlKey || e.metaKey);
  const hasShift = Boolean(e.shiftKey);
  const hasAlt = Boolean(e.altKey);

  if (requiresCtrl !== hasCtrl) return false;
  if (requiresShift !== hasShift) return false;
  if (requiresAlt !== hasAlt) return false;

  if (!baseKey) return false;
  const eventKey = (e.key === " " || e.code === "Space") ? "space" : e.key.toLowerCase();
  return eventKey === baseKey;
}

export function handleSearchInput(query: string, sortModeOverride?: SortMode): void {
  const state = store.getState();
  const mode = sortModeOverride || state.sortMode;
  const filtered = filterAndRankProjects(state.projects, query, mode, state.selectedTags);

  store.setState({
    searchQuery: query,
    sortMode: mode,
    filteredProjects: filtered,
    selectedIndex: 0
  });
}

export function handleSortChange(sortMode: SortMode): void {
  const state = store.getState();
  const filtered = filterAndRankProjects(state.projects, state.searchQuery, sortMode, state.selectedTags);

  store.setState({
    sortMode,
    filteredProjects: filtered,
    selectedIndex: 0
  });

  if (typeof window !== "undefined" && window.app?.settings?.update) {
    window.app.settings.update({ defaultSortMode: sortMode }).catch(() => {});
  }
}

export function handleTagToggle(tag: string): void {
  const state = store.getState();
  const normalizedTag = tag.toLowerCase().trim().replace(/^#/, "");
  const currentTags = state.selectedTags || [];

  let nextTags: string[];
  if (currentTags.includes(normalizedTag)) {
    nextTags = currentTags.filter((t) => t !== normalizedTag);
  } else {
    nextTags = [...currentTags, normalizedTag];
  }

  const filtered = filterAndRankProjects(state.projects, state.searchQuery, state.sortMode, nextTags);

  store.setState({
    selectedTags: nextTags,
    filteredProjects: filtered,
    selectedIndex: 0
  });
}

export function handleClearTags(): void {
  const state = store.getState();
  const filtered = filterAndRankProjects(state.projects, state.searchQuery, state.sortMode, []);

  store.setState({
    selectedTags: [],
    filteredProjects: filtered,
    selectedIndex: 0
  });
}

export function handleKeyNavigation(
  e: KeyboardEvent,
  actions: KeyNavigationActions
): void {
  const state = store.getState();

  // If a modal is open, let modal handle Esc or Enter
  if (state.activeModal !== "none") {
    if (e.key === "Escape") {
      e.preventDefault();
      store.setState({ activeModal: "none", collisionContext: null });
    }
    return;
  }

  // If global dropzone is visible, let Escape dismiss it
  if (e.key === "Escape" && actions.dismissDropzone && actions.dismissDropzone()) {
    e.preventDefault();
    return;
  }

  // Global shortcuts
  if ((e.ctrlKey || e.metaKey) && (e.key === "n" || e.key === "N")) {
    e.preventDefault();
    actions.openNewProject();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === ",") {
    e.preventDefault();
    actions.openSettings();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && (e.key === "e" || e.key === "E")) {
    e.preventDefault();
    actions.focusNote?.();
    return;
  }

  // Context Menu Shortcut (Shift+F10, physical ContextMenu key, or Alt+M)
  const isContextMenuKey =
    (e.shiftKey && e.key === "F10") ||
    e.key === "ContextMenu" ||
    e.key === "Apps" ||
    (e.altKey && (e.key === "m" || e.key === "M"));

  if (isContextMenuKey) {
    e.preventDefault();
    if (state.selectedProject) {
      actions.openContextMenu?.();
    }
    return;
  }

  // Quick Pin Shortcut
  const pinShortcut = state.config?.pinShortcut || "Ctrl+Shift+P";
  if (matchesShortcut(e, pinShortcut)) {
    e.preventDefault();
    if (state.selectedProject) {
      actions.togglePin?.();
    }
    return;
  }

  // Custom Quick Actions
  const openFolderShortcut = state.config?.openFolderShortcut || "Ctrl+Shift+S";
  if (matchesShortcut(e, openFolderShortcut)) {
    e.preventDefault();
    if (state.selectedProject) {
      actions.openFolder?.();
    }
    return;
  }

  const copyPathShortcut = state.config?.copyPathShortcut || "Ctrl+Shift+C";
  if (matchesShortcut(e, copyPathShortcut)) {
    e.preventDefault();
    if (state.selectedProject) {
      actions.copyPath?.();
    }
    return;
  }

  const activeEl = typeof document !== "undefined" ? document.activeElement : null;
  const targetEl = e.target as HTMLElement | null;
  const isInsideTextarea =
    activeEl?.tagName === "TEXTAREA" ||
    targetEl?.tagName === "TEXTAREA" ||
    (typeof HTMLTextAreaElement !== "undefined" &&
      (activeEl instanceof HTMLTextAreaElement || targetEl instanceof HTMLTextAreaElement));

  // Context: Note or Description Editor active
  if (isInsideTextarea) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (state.selectedProject) {
        actions.openSelected();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      actions.focusSearch?.();
      return;
    }

    // Cyclic Tab from within textareas
    if (e.key === "Tab") {
      const activeId = activeEl?.id || targetEl?.id;
      if (activeId === "project-note-input") {
        e.preventDefault();
        if (e.shiftKey) {
          if (actions.focusTags) {
            actions.focusTags();
          } else if (actions.focusDescription) {
            actions.focusDescription();
          } else {
            actions.focusSearch?.();
          }
        } else {
          actions.focusSearch?.();
        }
        return;
      }

      if (activeId === "project-desc-input") {
        e.preventDefault();
        if (e.shiftKey) {
          actions.focusSearch?.();
        } else {
          if (actions.focusTags) {
            actions.focusTags();
          } else {
            actions.focusNote?.();
          }
        }
        return;
      }
    }

    // Allow native multi-line editing: Enter, Shift+Enter, Arrow keys, etc.
    return;
  }

  // Context: Description Edit Button active
  const isEditDescBtn =
    activeEl?.id === "btn-edit-desc" || targetEl?.id === "btn-edit-desc";
  if (isEditDescBtn) {
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        actions.focusSearch?.();
      } else {
        if (actions.focusTags) {
          actions.focusTags();
        } else {
          actions.focusNote?.();
        }
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      actions.focusSearch?.();
      return;
    }
  }

  // Context: Tag Input active
  const isTagInput =
    activeEl?.id === "input-new-tag" || targetEl?.id === "input-new-tag";
  if (isTagInput) {
    if (e.key === "Enter") {
      // Handled in note-editor to create tag. Do not launch project.
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      actions.focusSearch?.();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        if (actions.focusDescription) {
          actions.focusDescription();
        } else {
          actions.focusSearch?.();
        }
      } else {
        actions.focusNote?.();
      }
      return;
    }
    return;
  }

  // Context: Search & List Navigation
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (state.filteredProjects.length > 0) {
      const nextIndex = Math.min(state.selectedIndex + 1, state.filteredProjects.length - 1);
      store.setState({ selectedIndex: nextIndex });
      scrollSelectedIntoView();
    }
    return;
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (state.filteredProjects.length > 0) {
      const prevIndex = Math.max(state.selectedIndex - 1, 0);
      store.setState({ selectedIndex: prevIndex });
      scrollSelectedIntoView();
    }
    return;
  }

  if (e.key === "Enter") {
    if (
      activeEl?.tagName === "BUTTON" ||
      targetEl?.tagName === "BUTTON" ||
      activeEl?.id === "input-new-tag" ||
      targetEl?.id === "input-new-tag"
    ) {
      return;
    }
    e.preventDefault();
    if (state.selectedProject) {
      actions.openSelected();
    }
    return;
  }

  if (e.key === "Tab") {
    const isSearchInput = activeEl?.id === "search-input" || (!activeEl && !isInsideTextarea);
    if (isSearchInput && state.selectedProject) {
      e.preventDefault();
      if (e.shiftKey) {
        actions.focusNote?.();
      } else {
        if (actions.focusDescription) {
          actions.focusDescription();
        } else {
          actions.focusNote?.();
        }
      }
      return;
    }
  }

  if (e.key === "Escape") {
    e.preventDefault();
    if (state.searchQuery && state.searchQuery.length > 0) {
      actions.clearSearch?.();
    } else {
      actions.closeOrHide();
    }
    return;
  }
}

function scrollSelectedIntoView(): void {
  const selectedEl = document.querySelector(".project-row.selected") as HTMLElement | null;
  if (selectedEl) {
    selectedEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}
