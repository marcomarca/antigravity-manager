import { store } from "../state";
import type { AppErrorPayload } from "../../domain/types";

export function setupCollisionDialog(
  modal: HTMLElement,
  messageEl: HTMLElement,
  actionsEl: HTMLElement,
  onClose: () => void,
  showToast: (msg: string) => void
): void {
  store.subscribe(() => {
    const { activeModal, collisionContext } = store.getState();

    if (activeModal === "collision" && collisionContext) {
      modal.classList.remove("hidden");
      renderCollisionActions(collisionContext, messageEl, actionsEl, onClose, showToast);
    } else {
      modal.classList.add("hidden");
    }
  });

  const closeBtn = document.getElementById("btn-close-collision");
  closeBtn?.addEventListener("click", () => {
    store.setState({ activeModal: "none", collisionContext: null });
  });
}

function renderCollisionActions(
  ctx: {
    type: "create" | "markdown";
    name: string;
    filePath?: string;
    folderExists?: boolean;
    fileExists?: boolean;
  },
  messageEl: HTMLElement,
  actionsEl: HTMLElement,
  onClose: () => void,
  showToast: (msg: string) => void
): void {
  actionsEl.innerHTML = "";

  if (ctx.type === "create") {
    messageEl.textContent = `A project named "${ctx.name}" already exists in your projects root directory.`;

    const btnOpen = document.createElement("button");
    btnOpen.className = "btn-primary";
    btnOpen.textContent = "Open Existing Project";
    btnOpen.addEventListener("click", async () => {
      try {
        const state = store.getState();
        const root = state.config?.projectsRoot || "";
        const targetPath = `${root}\\${ctx.name}`;
        await window.app.projects.open(targetPath);
        store.setState({ activeModal: "none", collisionContext: null });
        await window.app.window.hide();
      } catch (err) {
        showToast("Could not open existing project.");
      }
    });

    const btnCancel = document.createElement("button");
    btnCancel.className = "btn-secondary";
    btnCancel.textContent = "Cancel";
    btnCancel.addEventListener("click", () => {
      store.setState({ activeModal: "none", collisionContext: null });
    });

    actionsEl.appendChild(btnOpen);
    actionsEl.appendChild(btnCancel);
  } else {
    // Markdown import collision
    if (ctx.fileExists) {
      messageEl.textContent = `The Markdown file already exists in "${ctx.name}". Would you like to replace it?`;

      const btnReplace = document.createElement("button");
      btnReplace.className = "btn-primary";
      btnReplace.textContent = "Replace Markdown File";
      btnReplace.addEventListener("click", async () => {
        try {
          if (!ctx.filePath) return;
          await window.app.projects.importMarkdown({
            filePath: ctx.filePath,
            overrideCollision: "replace"
          });
          store.setState({ activeModal: "none", collisionContext: null });
          await window.app.window.hide();
        } catch (err) {
          showToast("Failed to replace markdown file.");
        }
      });

      const btnCancel = document.createElement("button");
      btnCancel.className = "btn-secondary";
      btnCancel.textContent = "Cancel";
      btnCancel.addEventListener("click", () => {
        store.setState({ activeModal: "none", collisionContext: null });
      });

      actionsEl.appendChild(btnReplace);
      actionsEl.appendChild(btnCancel);
    } else {
      messageEl.textContent = `A project named "${ctx.name}" already exists. How would you like to proceed?`;

      const btnOpen = document.createElement("button");
      btnOpen.className = "btn-primary";
      btnOpen.textContent = "Open Existing Project";
      btnOpen.addEventListener("click", async () => {
        try {
          const state = store.getState();
          const root = state.config?.projectsRoot || "";
          const targetPath = `${root}\\${ctx.name}`;
          await window.app.projects.open(targetPath);
          store.setState({ activeModal: "none", collisionContext: null });
          await window.app.window.hide();
        } catch (err) {
          showToast("Could not open existing project.");
        }
      });

      const btnCopy = document.createElement("button");
      btnCopy.className = "btn-secondary";
      btnCopy.textContent = "Copy Markdown Into Existing Project";
      btnCopy.addEventListener("click", async () => {
        try {
          if (!ctx.filePath) return;
          await window.app.projects.importMarkdown({
            filePath: ctx.filePath,
            overrideCollision: "copy_into_existing"
          });
          store.setState({ activeModal: "none", collisionContext: null });
          await window.app.window.hide();
        } catch (err) {
          showToast("Failed to copy markdown into project.");
        }
      });

      const btnCancel = document.createElement("button");
      btnCancel.className = "btn-secondary";
      btnCancel.textContent = "Cancel";
      btnCancel.addEventListener("click", () => {
        store.setState({ activeModal: "none", collisionContext: null });
      });

      actionsEl.appendChild(btnOpen);
      actionsEl.appendChild(btnCopy);
      actionsEl.appendChild(btnCancel);
    }
  }
}
