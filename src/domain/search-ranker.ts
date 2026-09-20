import type { Project, SortMode } from "./types";

export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, " ");
}

export function sortProjectsByMode(a: Project, b: Project, mode: SortMode): number {
  // Pinned projects always precede unpinned projects
  const aPinned = !!a.pinned;
  const bPinned = !!b.pinned;
  if (aPinned !== bPinned) {
    return aPinned ? -1 : 1;
  }

  switch (mode) {
    case "recent": {
      // 1. Antigravity recents by recentIndex ascending (0 is most recent)
      const aRecent = a.recentIndex !== undefined;
      const bRecent = b.recentIndex !== undefined;

      if (aRecent && bRecent) {
        return (a.recentIndex ?? 0) - (b.recentIndex ?? 0);
      }
      if (aRecent) return -1;
      if (bRecent) return 1;

      // 2. Fallback to modifiedAt descending
      const aMod = a.modifiedAt ?? 0;
      const bMod = b.modifiedAt ?? 0;
      if (bMod !== aMod) {
        return bMod - aMod;
      }

      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }

    case "name_asc": {
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }

    case "name_desc": {
      return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
    }

    case "modified_desc": {
      const aMod = a.modifiedAt ?? 0;
      const bMod = b.modifiedAt ?? 0;
      if (bMod !== aMod) {
        return bMod - aMod;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }

    case "created_desc": {
      const aCreated = a.createdAt ?? 0;
      const bCreated = b.createdAt ?? 0;
      if (bCreated !== aCreated) {
        return bCreated - aCreated;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }

    case "created_asc": {
      const aCreated = a.createdAt ?? 0;
      const bCreated = b.createdAt ?? 0;
      if (aCreated !== bCreated) {
        return aCreated - bCreated;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }

    default:
      return 0;
  }
}

export function rankProject(project: Project, query: string): number {
  if (!query) return 0;

  const q = normalizeQuery(query);
  if (!q) return 0;

  const name = project.name.toLowerCase();
  const path = project.path.toLowerCase();
  const description = (project.description || "").toLowerCase();
  const note = (project.note || "").toLowerCase();
  const tags = (project.tags || []).map((t) => t.toLowerCase());
  const pinBonus = project.pinned ? 50 : 0;

  // Tag filter if query starts with '#'
  if (q.startsWith("#")) {
    const rawTag = q.slice(1).trim();
    if (!rawTag) return -1;
    for (const tag of tags) {
      if (tag === rawTag) return 1000 + pinBonus;
      if (tag.startsWith(rawTag)) return 850 + pinBonus;
      if (tag.includes(rawTag)) return 700 + pinBonus;
    }
    return -1;
  }

  // Tier 1: Exact name
  if (name === q) {
    return 1000 + pinBonus;
  }

  // Tier 2: Name starts with query
  if (name.startsWith(q)) {
    return 800 - (name.length - q.length) + pinBonus;
  }

  // Tier 2.5: Tag match
  for (const tag of tags) {
    if (tag === q) return 750 + pinBonus;
    if (tag.startsWith(q)) return 650 + pinBonus;
    if (tag.includes(q)) return 550 + pinBonus;
  }

  // Tier 3: Name includes query word boundary or substring
  const nameIdx = name.indexOf(q);
  if (nameIdx >= 0) {
    return 600 - nameIdx + pinBonus;
  }

  // Tier 4: Description includes query
  const descIdx = description.indexOf(q);
  if (descIdx >= 0) {
    return 500 - Math.min(descIdx, 100) + pinBonus;
  }

  // Tier 5: Note includes query
  const noteIdx = note.indexOf(q);
  if (noteIdx >= 0) {
    return 400 - Math.min(noteIdx, 100) + pinBonus;
  }

  // Tier 6: Path includes query
  const pathIdx = path.indexOf(q);
  if (pathIdx >= 0) {
    return 200 - Math.min(pathIdx, 100) + pinBonus;
  }

  // No match
  return -1;
}

export function filterAndRankProjects(
  projects: Project[],
  rawQuery: string,
  sortMode: SortMode = "recent",
  activeTags?: string[]
): Project[] {
  let candidates = projects;

  // Filter by active tags (OR logic: match any of the selected tags)
  if (activeTags && activeTags.length > 0) {
    const normalizedActiveTags = activeTags.map((t) => t.toLowerCase().trim().replace(/^#/, ""));
    candidates = candidates.filter((proj) => {
      if (!proj.tags || proj.tags.length === 0) return false;
      const projTags = proj.tags.map((t) => t.toLowerCase());
      return normalizedActiveTags.some((tag) => projTags.includes(tag));
    });
  }

  const query = normalizeQuery(rawQuery);

  if (!query) {
    return [...candidates].sort((a, b) => sortProjectsByMode(a, b, sortMode));
  }

  const scored: Array<{ project: Project; score: number }> = [];

  for (const proj of candidates) {
    const score = rankProject(proj, query);
    if (score >= 0) {
      scored.push({ project: proj, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return sortProjectsByMode(a.project, b.project, sortMode);
  });

  return scored.map((item) => item.project);
}

export function getUniqueTagsWithCounts(
  projects: Project[]
): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();

  for (const proj of projects) {
    if (proj.tags && Array.isArray(proj.tags)) {
      for (const tag of proj.tags) {
        const normalized = tag.toLowerCase().trim().replace(/^#/, "");
        if (normalized) {
          counts.set(normalized, (counts.get(normalized) || 0) + 1);
        }
      }
    }
  }

  const result: Array<{ tag: string; count: number }> = [];
  for (const [tag, count] of counts.entries()) {
    result.push({ tag, count });
  }

  // Sort alphabetically by tag
  result.sort((a, b) => a.tag.localeCompare(b.tag, undefined, { sensitivity: "base" }));

  return result;
}
