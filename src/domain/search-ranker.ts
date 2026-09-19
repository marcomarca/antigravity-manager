import type { Project } from "./types";

export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, " ");
}

export function rankProject(project: Project, query: string): number {
  if (!query) return 0;

  const q = normalizeQuery(query);
  if (!q) return 0;

  const name = project.name.toLowerCase();
  const path = project.path.toLowerCase();
  const description = (project.description || "").toLowerCase();
  const note = (project.note || "").toLowerCase();

  // Tier 1: Exact name
  if (name === q) {
    return 1000;
  }

  // Tier 2: Name starts with query
  if (name.startsWith(q)) {
    return 800 - (name.length - q.length); // closer length ranks higher
  }

  // Tier 3: Name includes query word boundary or substring
  const nameIdx = name.indexOf(q);
  if (nameIdx >= 0) {
    return 600 - nameIdx;
  }

  // Tier 4: Description includes query
  const descIdx = description.indexOf(q);
  if (descIdx >= 0) {
    return 500 - Math.min(descIdx, 100);
  }

  // Tier 5: Note includes query
  const noteIdx = note.indexOf(q);
  if (noteIdx >= 0) {
    return 400 - Math.min(noteIdx, 100);
  }

  // Tier 6: Path includes query
  const pathIdx = path.indexOf(q);
  if (pathIdx >= 0) {
    return 200 - Math.min(pathIdx, 100);
  }

  // No match
  return -1;
}

export function filterAndRankProjects(projects: Project[], rawQuery: string): Project[] {
  const query = normalizeQuery(rawQuery);

  if (!query) {
    // Initial order per section 19:
    // 1. Antigravity recents by recentIndex
    // 2. Rest from projectsRoot, alphabetically
    return [...projects].sort((a, b) => {
      const aRecent = a.recentIndex !== undefined;
      const bRecent = b.recentIndex !== undefined;

      if (aRecent && bRecent) {
        return (a.recentIndex ?? 0) - (b.recentIndex ?? 0);
      }
      if (aRecent) return -1;
      if (bRecent) return 1;

      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }

  const scored: Array<{ project: Project; score: number }> = [];

  for (const proj of projects) {
    const score = rankProject(proj, query);
    if (score >= 0) {
      scored.push({ project: proj, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.project.name.localeCompare(b.project.name);
  });

  return scored.map((item) => item.project);
}
