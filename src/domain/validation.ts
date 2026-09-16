import { AppError } from "./errors";

const INVALID_WINDOWS_CHARS = /[<>:"/\\|?*\x00-\x1F]/;
const RESERVED_NAMES = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateProjectName(name: string): ValidationResult {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Project name cannot be empty." };
  }

  if (name.endsWith(".") || name.endsWith(" ")) {
    return { valid: false, error: "Project name cannot end with a period or space." };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Project name cannot be empty or whitespace only." };
  }

  if (trimmed === "." || trimmed === "..") {
    return { valid: false, error: "Project name cannot be '.' or '..'." };
  }

  if (INVALID_WINDOWS_CHARS.test(trimmed)) {
    return { valid: false, error: 'Project name contains invalid characters (< > : " / \\ | ? *).' };
  }

  const baseName = trimmed.split(".")[0]?.toUpperCase() ?? "";
  if (RESERVED_NAMES.has(baseName)) {
    return { valid: false, error: `"${trimmed}" is a reserved Windows device name.` };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: "Project name is too long (maximum 255 characters)." };
  }

  return { valid: true };
}

export function assertValidProjectName(name: string): string {
  const result = validateProjectName(name);
  if (!result.valid) {
    throw new AppError("INVALID_PROJECT_NAME", result.error ?? "Invalid project name.");
  }
  return name.trim();
}

export function sanitizeProjectName(rawName: string): string {
  let cleaned = rawName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Remove trailing dots and spaces
  while (cleaned.endsWith(".") || cleaned.endsWith(" ")) {
    cleaned = cleaned.slice(0, -1).trim();
  }

  if (!cleaned || cleaned === "." || cleaned === "..") {
    cleaned = "Untitled Project";
  }

  const baseUpper = cleaned.split(".")[0]?.toUpperCase() ?? "";
  if (RESERVED_NAMES.has(baseUpper)) {
    cleaned = `${cleaned}_Project`;
  }

  return cleaned;
}

export function deriveProjectNameFromMarkdown(filePath: string): string {
  if (!filePath || typeof filePath !== "string") {
    throw new AppError("INVALID_MARKDOWN", "Invalid Markdown file path.");
  }

  const normalized = filePath.replace(/\\/g, "/");
  const fileName = normalized.split("/").pop() ?? "";

  if (!fileName.toLowerCase().endsWith(".md")) {
    throw new AppError("INVALID_MARKDOWN", "File must have a .md extension.");
  }

  const stem = fileName.slice(0, -3);
  const sanitized = sanitizeProjectName(stem);
  return assertValidProjectName(sanitized);
}
