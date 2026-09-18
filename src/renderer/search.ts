import { filterAndRankProjects } from "../domain/search-ranker";
import { store } from "./state";

export interface KeyNavigationActions {
  openSelected: () => void;
  openNewProject: () => void;
  openSettings: () => void;
  closeOrHide: () => void;
  focusNote?: () => void;
  focusSearch?: () => void;
  clearSearch?: () => void;
}

export function handleSearchInput(query: string): void {
  const state = store.getState();
  const filtered = filterAndRankProjects(state.projects, query);

  store.setState({
    searchQuery: query,
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

  const activeEl = typeof document !== "undefined" ? document.activeElement : null;
  const targetEl = e.target as HTMLElement | null;
  const isInsideTextarea =
    activeEl?.tagName === "TEXTAREA" ||
    targetEl?.tagName === "TEXTAREA" ||
    (typeof HTMLTextAreaElement !== "undefined" &&
      (activeEl instanceof HTMLTextAreaElement || targetEl instanceof HTMLTextAreaElement));

  // Context: Note Editor active
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

    // Allow native multi-line editing: Enter, Shift+Enter, Arrow keys, etc.
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
    e.preventDefault();
    if (state.selectedProject) {
      actions.openSelected();
    }
    return;
  }

  if (e.key === "Tab" && !e.shiftKey && activeEl?.id === "search-input") {
    if (state.selectedProject) {
      e.preventDefault();
      actions.focusNote?.();
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
