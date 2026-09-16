import { store } from "../state";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let savedBadgeTimer: ReturnType<typeof setTimeout> | null = null;

export function setupNoteEditor(
  textarea: HTMLTextAreaElement,
  savedBadge: HTMLElement
): void {
  // Sync textarea content with selected project
  let currentLoadedPath: string | null = null;

  store.subscribe(() => {
    const { selectedProject } = store.getState();
    const newPath = selectedProject?.path || null;

    if (newPath !== currentLoadedPath) {
      currentLoadedPath = newPath;
      if (selectedProject) {
        textarea.disabled = false;
        textarea.value = selectedProject.note || "";
        textarea.placeholder = `Notes for ${selectedProject.name}...`;
      } else {
        textarea.disabled = true;
        textarea.value = "";
        textarea.placeholder = "Select a project to view or edit notes...";
      }
    }
  });

  textarea.addEventListener("input", () => {
    const { selectedProject } = store.getState();
    if (!selectedProject) return;

    const newNote = textarea.value;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      try {
        await window.app.projects.setNote(selectedProject.path, newNote);
        selectedProject.note = newNote.trim() || undefined;

        // Show "Saved" badge briefly
        savedBadge.classList.remove("hidden");
        if (savedBadgeTimer) clearTimeout(savedBadgeTimer);
        savedBadgeTimer = setTimeout(() => {
          savedBadge.classList.add("hidden");
        }, 1500);
      } catch (err) {
        console.error("Failed autosaving note:", err);
      }
    }, 350);
  });
}
