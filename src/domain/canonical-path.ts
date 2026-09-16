import { AppError } from "./errors";

/**
 * Standardizes a path for display (preserving user casing, using standard Windows backslashes)
 */
export function normalizePath(rawPath: string): string {
  if (!rawPath) return "";
  let p = rawPath.trim().replace(/\//g, "\\");
  // Remove trailing slashes unless root drive like C:\
  while (p.length > 3 && p.endsWith("\\")) {
    p = p.slice(0, -1);
  }
  return p;
}

/**
 * Produces a normalized, lowercased canonical key for dictionary deduplication
 */
export function canonicalPathKey(rawPath: string): string {
  return normalizePath(rawPath).toLowerCase();
}

/**
 * Ensures target is strictly inside projectsRoot (no path traversal .. escape)
 */
export function assertInsideProjectsRoot(targetPath: string, projectsRoot: string): void {
  const normTarget = canonicalPathKey(targetPath);
  const normRoot = canonicalPathKey(projectsRoot);

  if (normTarget === normRoot) {
    throw new AppError("INVALID_PROJECT_NAME", "Target path cannot be the root projects folder itself.");
  }

  // Ensure target starts with root + "\"
  const expectedPrefix = normRoot.endsWith("\\") ? normRoot : `${normRoot}\\`;
  if (!normTarget.startsWith(expectedPrefix)) {
    throw new AppError("PROJECT_ROOT_UNAVAILABLE", `Target path "${targetPath}" is outside the designated projects root.`);
  }

  // Ensure direct child (no nested sub-sub directories for direct creations)
  const relativePart = normTarget.slice(expectedPrefix.length);
  if (relativePart.includes("\\")) {
    throw new AppError("INVALID_PROJECT_NAME", "Nested project directories are not supported for single-level creation.");
  }
}
