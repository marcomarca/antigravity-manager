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

  // Tags elements
  tagsList?: HTMLElement;
  inputNewTag?: HTMLInputElement;
  tagSavedBadge?: HTMLElement;

  // Quick Action elements
  btnTogglePin?: HTMLButtonElement;
  pinIcon?: HTMLElement;
  pinLabel?: HTMLElement;
  btnOpenFolder?: HTMLButtonElement;
  btnCopyPath?: HTMLButtonElement;

  // Notes elements
  noteTextarea: HTMLTextAreaElement;
  noteSavedBadge: HTMLElement;

  // Actions / Handlers
  onTogglePin?: () => void;
  onOpenFolder?: () => void;
  onCopyPath?: () => void;
  onTagClick?: (tag: string) => void;
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
    tagsList,
    inputNewTag,
    tagSavedBadge,
    btnTogglePin,
    pinLabel,
    btnOpenFolder,
    btnCopyPath,
    noteTextarea,
    noteSavedBadge,
    onTogglePin,
    onOpenFolder,
    onCopyPath,
    onTagClick
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

  const renderTags = (tags: string[]) => {
    if (!tagsList) return;
    tagsList.innerHTML = "";

    if (!tags || tags.length === 0) {
      tagsList.innerHTML = `<span class="tag-empty-placeholder">No tags. Add one below.</span>`;
      return;
    }

    tags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.innerHTML = `
        <span class="tag-text">#${tag}</span>
        <button class="tag-chip-remove" title="Remove tag ${tag}" type="button">✕</button>
      `;

      const removeBtn = chip.querySelector(".tag-chip-remove");
      if (removeBtn) {
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          removeTag(tag);
        });
      }

      chip.addEventListener("click", () => {
        onTagClick?.(tag);
      });

      tagsList.appendChild(chip);
    });
  };

  const addTag = async (rawTag: string) => {
    const { selectedProject, projects } = store.getState();
    if (!selectedProject) return;

    const clean = rawTag.trim().toLowerCase().replace(/^#+/, "");
    if (!clean) return;

    const currentTags = selectedProject.tags || [];
    if (currentTags.includes(clean)) return;

    const updatedTags = [...currentTags, clean];
    try {
      await window.app.projects.setTags(selectedProject.path, updatedTags);
      selectedProject.tags = updatedTags;
      renderTags(updatedTags);

      if (inputNewTag) inputNewTag.value = "";

      // Flash "Saved" indicator
      if (tagSavedBadge) {
        tagSavedBadge.classList.remove("hidden");
        setTimeout(() => tagSavedBadge.classList.add("hidden"), 1500);
      }

      // Sync state so project list updates tag badges
      store.setState({ projects: [...projects] });
    } catch (err) {
      console.error("Failed adding project tag:", err);
    }
  };

  const removeTag = async (tagToRemove: string) => {
    const { selectedProject, projects } = store.getState();
    if (!selectedProject) return;

    const currentTags = selectedProject.tags || [];
    const updatedTags = currentTags.filter((t) => t !== tagToRemove);

    try {
      await window.app.projects.setTags(selectedProject.path, updatedTags);
      selectedProject.tags = updatedTags;
      renderTags(updatedTags);

      if (tagSavedBadge) {
        tagSavedBadge.classList.remove("hidden");
        setTimeout(() => tagSavedBadge.classList.add("hidden"), 1500);
      }

      store.setState({ projects: [...projects] });
    } catch (err) {
      console.error("Failed removing project tag:", err);
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
    const { selectedProject, projects } = store.getState();
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

      store.setState({ projects: [...projects] });
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

    // Update Quick Action buttons regardless of path change
    if (btnTogglePin) {
      btnTogglePin.disabled = !selectedProject;
      btnTogglePin.classList.toggle("active", !!selectedProject?.pinned);
      if (pinLabel) pinLabel.textContent = selectedProject?.pinned ? "Pinned" : "Pin";
    }
    if (btnOpenFolder) btnOpenFolder.disabled = !selectedProject;
    if (btnCopyPath) btnCopyPath.disabled = !selectedProject;

    if (newPath !== currentLoadedPath) {
      currentLoadedPath = newPath;
      setDescEditMode(false);

      if (selectedProject) {
        btnEditDesc.disabled = false;
        updateDescView(selectedProject.description);
        descInput.value = selectedProject.description || "";

        renderTags(selectedProject.tags || []);
        if (inputNewTag) {
          inputNewTag.disabled = false;
          inputNewTag.value = "";
        }

        noteTextarea.disabled = false;
        noteTextarea.value = selectedProject.note || "";
        noteTextarea.placeholder = `Notes for ${selectedProject.name}...\n\n• Enter: new line\n• Ctrl+Enter: launch project\n• Esc: return to search`;
      } else {
        btnEditDesc.disabled = true;
        descView.innerHTML = `<span class="desc-placeholder">Select a project to view details...</span>`;
        descView.classList.add("empty");
        descInput.value = "";

        renderTags([]);
        if (inputNewTag) {
          inputNewTag.disabled = true;
          inputNewTag.value = "";
        }

        noteTextarea.disabled = true;
        noteTextarea.value = "";
        noteTextarea.placeholder = "Select a project to view or edit notes...";
      }
    }
  });

  // Quick Action button listeners
  if (btnTogglePin && onTogglePin) {
    btnTogglePin.addEventListener("click", onTogglePin);
  }
  if (btnOpenFolder && onOpenFolder) {
    btnOpenFolder.addEventListener("click", onOpenFolder);
  }
  if (btnCopyPath && onCopyPath) {
    btnCopyPath.addEventListener("click", onCopyPath);
  }

  // Tag input listener
  if (inputNewTag) {
    inputNewTag.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag(inputNewTag.value);
      }
    });
  }

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
