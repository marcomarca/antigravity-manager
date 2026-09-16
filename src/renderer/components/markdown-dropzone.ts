import { store } from "../state";
import type { AppErrorPayload } from "../../domain/types";

export function setupMarkdownDropzones(
  globalDropzone: HTMLElement,
  modalDropzone: HTMLElement,
  showToast: (msg: string) => void
): void {
  let dragCounter = 0;

  // Global window drag & drop
  window.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dragCounter++;
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      globalDropzone.classList.remove("hidden");
    }
  });

  window.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      globalDropzone.classList.add("hidden");
    }
  });

  window.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  window.addEventListener("drop", async (e) => {
    e.preventDefault();
    dragCounter = 0;
    globalDropzone.classList.add("hidden");

    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) {
      return;
    }

    if (e.dataTransfer.files.length > 1) {
      showToast("Please drop only one Markdown file at a time.");
      return;
    }

    const file = e.dataTransfer.files[0];
    if (!file) return;

    await processDroppedMarkdown(file, showToast);
  });

  // Modal dropzone specific styling
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

    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) {
      return;
    }

    if (e.dataTransfer.files.length > 1) {
      showToast("Please drop only one Markdown file at a time.");
      return;
    }

    const file = e.dataTransfer.files[0];
    if (!file) return;

    await processDroppedMarkdown(file, showToast);
  });
}

async function processDroppedMarkdown(file: File, showToast: (msg: string) => void): Promise<void> {
  if (!file.name.toLowerCase().endsWith(".md")) {
    showToast("Invalid file: only Markdown (.md) files are supported.");
    return;
  }

  const filePath = window.app.utils.getPathForFile(file);
  if (!filePath) {
    showToast("Could not resolve local file path for dropped file.");
    return;
  }

  try {
    showToast("Materializing project from Markdown...");
    await window.app.projects.importMarkdown({ filePath });
    store.setState({ activeModal: "none", collisionContext: null });
    await window.app.window.hide();
  } catch (err: any) {
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
