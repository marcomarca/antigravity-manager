import { store } from "../state";
import { createProjectRowElement } from "./project-row";
import type { Project } from "../../domain/types";

export function setupProjectList(
  container: HTMLElement,
  emptyState: HTMLElement,
  onOpenProject: (proj: Project) => void,
  onContextMenu?: (proj: Project, e: MouseEvent) => void,
  onTagClick?: (tag: string) => void
): void {
  let prevProjects: Project[] = [];
  let prevSelectedIndex = -1;
  let prevQuery = "";

  store.subscribe(() => {
    const { filteredProjects, selectedIndex, searchQuery } = store.getState();

    const isListChanged =
      filteredProjects !== prevProjects ||
      selectedIndex !== prevSelectedIndex ||
      searchQuery !== prevQuery;

    if (!isListChanged) return;

    prevProjects = filteredProjects;
    prevSelectedIndex = selectedIndex;
    prevQuery = searchQuery;

    container.innerHTML = "";

    if (filteredProjects.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");

      filteredProjects.forEach((proj, idx) => {
        const isSelected = idx === selectedIndex;
        const rowEl = createProjectRowElement(
          proj,
          isSelected,
          searchQuery,
          () => {
            store.setState({ selectedIndex: idx });
          },
          () => {
            onOpenProject(proj);
          },
          (p, e) => {
            onContextMenu?.(p, e);
          },
          (tag) => {
            onTagClick?.(tag);
          }
        );
        container.appendChild(rowEl);
      });
    }
  });
}
