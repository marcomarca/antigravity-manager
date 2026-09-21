import { store } from "../state";
import type { AppErrorPayload } from "../../domain/types";

export interface MarkdownDropzonesController {
  reset: () => void;
  hide: () => void;
  isVisible: () => boolean;
}

export function setupMarkdownDropzones(
  globalDropzone: HTMLElement,
  modalDropzone: HTMLElement,
  showToast: (msg: string) => void
): MarkdownDropzonesController {
  let dragCounter = 0;

  const hideGlobalDropzone = () => {
    dragCounter = 0;
    globalDropzone.classList.add("hidden");
  };

  const isVisible = () => !globalDropzone.classList.contains("hidden");

  // Global window drag & drop
  window.addEventListener("dragenter", (e) => {
    e.preventDefault();
    if (store.getState().activeModal !== "none") {
      return;
    }
    dragCounter++;
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      globalDropzone.classList.remove("hidden");
    }
  });

  window.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      hideGlobalDropzone();
    }
  });

  window.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  window.addEventListener("drop", async (e) => {
    e.preventDefault();
    hideGlobalDropzone();

    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) {
      return;
    }

    if (e.dataTransfer.files.length > 1) {
      showToast("Please drop only one Markdown file at a time.");
      return;
    }

    const file = e.dataTransfer.files[0];
    if (!file) return;

    await processDroppedMarkdown(file, showToast, hideGlobalDropzone);
  });

  // Clicking anywhere on global dropzone overlay dismisses it
  globalDropzone.addEventListener("click", () => {
    hideGlobalDropzone();
  });

  // Modal dropzone specific styling and handling
  modalDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    modalDropzone.classList.add("dragover");
  });

  modalDropzone.addEventListener("dragleave", () => {
    modalDropzone.classList.remove("dragover");
  });

  modalDropzone.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    modalDropzone.classList.remove("dragover");
    hideGlobalDropzone();

    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) {
      return;
    }

    if (e.dataTransfer.files.length > 1) {
      showToast("Please drop only one Markdown file at a time.");
      return;
    }

    const file = e.dataTransfer.files[0];
    if (!file) return;

    await processDroppedMarkdown(file, showToast, hideGlobalDropzone);
  });

  // Reset on window blur (e.g. user drags out or switches app)
  window.addEventListener("blur", () => {
    hideGlobalDropzone();
  });

  // Escape key immediately dismisses visible global dropzone
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isVisible()) {
      e.preventDefault();
      e.stopPropagation();
      hideGlobalDropzone();
    }
  });

  return {
    reset: hideGlobalDropzone,
    hide: hideGlobalDropzone,
    isVisible
  };
}

async function processDroppedMarkdown(
  file: File,
  showToast: (msg: string) => void,
  onCleanup?: () => void
): Promise<void> {
  if (!file.name.toLowerCase().endsWith(".md")) {
    showToast("Invalid file: only Markdown (.md) files are supported.");
    onCleanup?.();
    return;
  }

  const filePath = window.app.utils.getPathForFile(file);
  if (!filePath) {
    showToast("Could not resolve local file path for dropped file.");
    onCleanup?.();
    return;
  }

  try {
    showToast("Materializing project from Markdown...");
    await window.app.projects.importMarkdown({ filePath });
    store.setState({ activeModal: "none", collisionContext: null });
    onCleanup?.();
    await window.app.window.hide();
  } catch (err: any) {
    onCleanup?.();
    const errorPayload = err as AppErrorPayload;
    if (errorPayload.code === "PROJECT_EXISTS") {
      const details = (errorPayload.details || {}) as any;
      store.setState({
        activeModal: "collision",
        collisionContext: {
          type: "markdown",
          name: details.name || file.name.replace(/\.md$/i, ""),
          filePath,
          folderExists: details.folderExists,
          fileExists: details.fileExists
        }
      });
    } else {
      showToast(errorPayload.message || "Failed to import Markdown.");
    }
  }
}
