import { filterAndRankProjects } from "../domain/search-ranker";
import { store } from "./state";

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
  actions: {
    openSelected: () => void;
    openNewProject: () => void;
    openSettings: () => void;
    closeOrHide: () => void;
  }
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

  if (e.ctrlKey && (e.key === "n" || e.key === "N")) {
    e.preventDefault();
    actions.openNewProject();
    return;
  }

  if (e.ctrlKey && e.key === ",") {
    e.preventDefault();
    actions.openSettings();
    return;
  }

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

  if (e.key === "Escape") {
    e.preventDefault();
    actions.closeOrHide();
    return;
  }
}

function scrollSelectedIntoView(): void {
  const selectedEl = document.querySelector(".project-row.selected") as HTMLElement | null;
  if (selectedEl) {
    selectedEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}
