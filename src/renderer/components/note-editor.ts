import { store } from "../state";

let noteDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let noteSavedBadgeTimer: ReturnType<typeof setTimeout> | null = null;
let descSavedBadgeTimer: ReturnType<typeof setTimeout> | null = null;

export interface ProjectDetailsElements {
  // Definition elements
  descView: HTMLElement;
  descEditWrap: HTMLElement;
  descInput: HTMLTextAreaElement;
  btnEditDesc: HTMLButtonElement;
  btnSaveDesc: HTMLButtonElement;
  btnCancelDesc: HTMLButtonElement;
  descSavedBadge: HTMLElement;

  // Notes elements
  noteTextarea: HTMLTextAreaElement;
  noteSavedBadge: HTMLElement;
}

export function setupProjectDetails(elements: ProjectDetailsElements): void {
  const {
    descView,
    descEditWrap,
    descInput,
    btnEditDesc,
    btnSaveDesc,
    btnCancelDesc,
    descSavedBadge,
    noteTextarea,
    noteSavedBadge
  } = elements;

  let currentLoadedPath: string | null = null;
  let isEditingDesc = false;

  const updateDescView = (text?: string) => {
    const trimmed = (text || "").trim();
    if (trimmed) {
      descView.textContent = trimmed;
      descView.classList.remove("empty");
    } else {
      descView.innerHTML = `<span class="desc-placeholder">No definition. Click ✏️ to add what this project does.</span>`;
      descView.classList.add("empty");
    }
  };

  const setDescEditMode = (editing: boolean) => {
    isEditingDesc = editing;
    if (editing) {
      const { selectedProject } = store.getState();
      descInput.value = selectedProject?.description || "";
      descView.classList.add("hidden");
      descEditWrap.classList.remove("hidden");
      btnEditDesc.classList.add("active");
      descInput.focus();
      descInput.select();
    } else {
      descEditWrap.classList.add("hidden");
      descView.classList.remove("hidden");
      btnEditDesc.classList.remove("active");
    }
  };

  const saveCurrentDescription = async () => {
    const { selectedProject } = store.getState();
    if (!selectedProject) return;

    const newDesc = descInput.value;
    try {
      await window.app.projects.setDescription(selectedProject.path, newDesc);
      selectedProject.description = newDesc.trim() || undefined;
      updateDescView(selectedProject.description);
      setDescEditMode(false);

      // Show "Saved" badge briefly
      descSavedBadge.classList.remove("hidden");
      if (descSavedBadgeTimer) clearTimeout(descSavedBadgeTimer);
      descSavedBadgeTimer = setTimeout(() => {
        descSavedBadge.classList.add("hidden");
      }, 1500);
    } catch (err) {
      console.error("Failed saving project definition:", err);
    }
  };

  const saveCurrentNote = async () => {
    const { selectedProject } = store.getState();
    if (!selectedProject) return;

    const newNote = noteTextarea.value;
    try {
      await window.app.projects.setNote(selectedProject.path, newNote);
      selectedProject.note = newNote.trim() || undefined;

      // Show "Saved" badge briefly
      noteSavedBadge.classList.remove("hidden");
      if (noteSavedBadgeTimer) clearTimeout(noteSavedBadgeTimer);
      noteSavedBadgeTimer = setTimeout(() => {
        noteSavedBadge.classList.add("hidden");
      }, 1500);
    } catch (err) {
      console.error("Failed autosaving note:", err);
    }
  };

  // Subscribe to store changes
  store.subscribe(() => {
    const { selectedProject } = store.getState();
    const newPath = selectedProject?.path || null;

    if (newPath !== currentLoadedPath) {
      currentLoadedPath = newPath;
      setDescEditMode(false);

      if (selectedProject) {
        btnEditDesc.disabled = false;
        updateDescView(selectedProject.description);
        descInput.value = selectedProject.description || "";

        noteTextarea.disabled = false;
        noteTextarea.value = selectedProject.note || "";
        noteTextarea.placeholder = `Notes for ${selectedProject.name}...\n\n• Enter: new line\n• Ctrl+Enter: launch project\n• Esc: return to search`;
      } else {
        btnEditDesc.disabled = true;
        descView.innerHTML = `<span class="desc-placeholder">Select a project to view details...</span>`;
        descView.classList.add("empty");
        descInput.value = "";

        noteTextarea.disabled = true;
        noteTextarea.value = "";
        noteTextarea.placeholder = "Select a project to view or edit notes...";
      }
    }
  });

  // Description actions
  btnEditDesc.addEventListener("click", () => {
    const { selectedProject } = store.getState();
    if (!selectedProject) return;
    setDescEditMode(!isEditingDesc);
  });

  btnSaveDesc.addEventListener("click", () => {
    saveCurrentDescription();
  });

  btnCancelDesc.addEventListener("click", () => {
    setDescEditMode(false);
  });

  descInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      saveCurrentDescription();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDescEditMode(false);
    }
  });

  // Notes actions
  noteTextarea.addEventListener("input", () => {
    if (noteDebounceTimer) {
      clearTimeout(noteDebounceTimer);
    }
    noteDebounceTimer = setTimeout(() => {
      noteDebounceTimer = null;
      saveCurrentNote();
    }, 350);
  });

  noteTextarea.addEventListener("blur", () => {
    if (noteDebounceTimer) {
      clearTimeout(noteDebounceTimer);
      noteDebounceTimer = null;
      saveCurrentNote();
    }
  });
}

/** Legacy wrapper for compatibility if needed */
export function setupNoteEditor(
  textarea: HTMLTextAreaElement,
  savedBadge: HTMLElement
): void {
  const noopEl = document.createElement("div");
  const noopBtn = document.createElement("button");
  const noopInput = document.createElement("textarea");

  setupProjectDetails({
    descView: noopEl,
    descEditWrap: noopEl,
    descInput: noopInput,
    btnEditDesc: noopBtn,
    btnSaveDesc: noopBtn,
    btnCancelDesc: noopBtn,
    descSavedBadge: noopEl,
    noteTextarea: textarea,
    noteSavedBadge: savedBadge
  });
}
