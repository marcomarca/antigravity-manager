import { store } from "../state";
import { validateProjectName } from "../../domain/validation";
import type { AppErrorPayload } from "../../domain/types";

export function setupNewProjectModal(
  modal: HTMLElement,
  input: HTMLInputElement,
  errorEl: HTMLElement,
  submitBtn: HTMLButtonElement,
  chatgptBtn: HTMLButtonElement,
  closeBtn: HTMLElement,
  showToast: (msg: string) => void
): void {
  store.subscribe(() => {
    const { activeModal } = store.getState();
    if (activeModal === "new_project") {
      modal.classList.remove("hidden");
      input.value = "";
      errorEl.classList.add("hidden");
      setTimeout(() => input.focus(), 50);
    } else {
      modal.classList.add("hidden");
    }
  });

  const closeModal = () => {
    store.setState({ activeModal: "none" });
  };

  closeBtn.addEventListener("click", closeModal);

  const handleCreate = async () => {
    const name = input.value.trim();
    const val = validateProjectName(name);

    if (!val.valid) {
      errorEl.textContent = val.error || "Invalid project name.";
      errorEl.classList.remove("hidden");
      input.focus();
      return;
    }

    errorEl.classList.add("hidden");

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating...";

      await window.app.projects.create(name);
      closeModal();
      await window.app.window.hide();
    } catch (err: any) {
      const errorPayload = err as AppErrorPayload;
      if (errorPayload.code === "PROJECT_EXISTS") {
        store.setState({
          activeModal: "collision",
          collisionContext: {
            type: "create",
            name
          }
        });
      } else {
        errorEl.textContent = errorPayload.message || "Failed to create project.";
        errorEl.classList.remove("hidden");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Project";
    }
  };

  submitBtn.addEventListener("click", handleCreate);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
    }
  });

  chatgptBtn.addEventListener("click", async () => {
    try {
      showToast("Starting ChatGPT planning flow...");
      const result = await window.app.planning.start();
      if (result.pasted) {
        showToast("ChatGPT opened & prompt pasted ready to review!");
      } else {
        showToast("Prompt copied to clipboard. Paste it into ChatGPT!");
      }
      closeModal();
    } catch (err: any) {
      showToast(err.message || "Failed to start ChatGPT.");
    }
  });
}
