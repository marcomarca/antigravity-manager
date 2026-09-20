import type { Project } from "../../domain/types";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function highlightMatch(text: string, query: string): string {
  if (!query) return escapeHtml(text);
  const q = query.trim().toLowerCase();
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return escapeHtml(text);

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);

  return `${escapeHtml(before)}<span class="highlight">${escapeHtml(match)}</span>${escapeHtml(after)}`;
}

export function createProjectRowElement(
  project: Project,
  isSelected: boolean,
  query: string,
  onSelect: () => void,
  onOpen: () => void,
  onContextMenu?: (project: Project, e: MouseEvent) => void,
  onTagClick?: (tag: string) => void
): HTMLElement {
  const row = document.createElement("div");
  row.className = `project-row ${isSelected ? "selected" : ""} ${project.pinned ? "is-pinned" : ""}`;
  row.setAttribute("role", "option");
  row.setAttribute("aria-selected", isSelected ? "true" : "false");

  const isWorkspace = project.type === "workspace";
  const icon = isWorkspace ? "📦" : "📁";

  let badgesHtml = "";
  if (project.pinned) {
    badgesHtml += `<span class="badge badge-pinned" title="Pinned to top">📌 Pinned</span>`;
  }
  if (project.source.antigravityRecent) {
    badgesHtml += `<span class="badge badge-recent">Recent</span>`;
  }
  if (project.source.projectsRoot) {
    badgesHtml += `<span class="badge badge-root">Root</span>`;
  }
  if (isWorkspace) {
    badgesHtml += `<span class="badge badge-workspace">Workspace</span>`;
  }
  if (project.tags && project.tags.length > 0) {
    for (const tag of project.tags) {
      badgesHtml += `<span class="badge badge-tag" data-tag="${escapeHtml(tag)}" title="Filter by #${escapeHtml(tag)}">#${highlightMatch(tag, query)}</span>`;
    }
  }

  let snippetHtml = "";
  const q = query.trim().toLowerCase();
  if (project.description && q && project.description.toLowerCase().includes(q)) {
    snippetHtml = `<div class="project-row-note-snippet">${highlightMatch(project.description, query)}</div>`;
  } else if (project.note && q && project.note.toLowerCase().includes(q)) {
    snippetHtml = `<div class="project-row-note-snippet">${highlightMatch(project.note, query)}</div>`;
  } else if (project.description) {
    snippetHtml = `<div class="project-row-note-snippet">${highlightMatch(project.description, query)}</div>`;
  } else if (project.note) {
    snippetHtml = `<div class="project-row-note-snippet">${highlightMatch(project.note, query)}</div>`;
  }

  row.innerHTML = `
    <div class="project-row-top">
      <div class="project-name-group">
        <span class="project-icon">${icon}</span>
        <span class="project-name">${highlightMatch(project.name, query)}</span>
      </div>
      <div class="project-badges">
        ${badgesHtml}
      </div>
    </div>
    <div class="project-row-path">${highlightMatch(project.path, query)}</div>
    ${snippetHtml}
  `;

  // Tag badges click to filter
  const tagEls = row.querySelectorAll(".badge-tag");
  tagEls.forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const tag = el.getAttribute("data-tag");
      if (tag) onTagClick?.(tag);
    });
  });

  row.addEventListener("click", () => {
    onSelect();
  });

  row.addEventListener("dblclick", () => {
    onOpen();
  });

  row.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    onSelect();
    onContextMenu?.(project, e);
  });

  return row;
}
