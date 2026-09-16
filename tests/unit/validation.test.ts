import { describe, expect, it } from "bun:test";
import {
  assertValidProjectName,
  deriveProjectNameFromMarkdown,
  sanitizeProjectName,
  validateProjectName
} from "../../src/domain/validation";

describe("Project Name Validation", () => {
  it("accepts valid project names", () => {
    expect(validateProjectName("Invoice API").valid).toBe(true);
    expect(validateProjectName("My Cool App 2026").valid).toBe(true);
    expect(validateProjectName("Proyecto Español Ñandú").valid).toBe(true);
  });

  it("rejects empty names or whitespace", () => {
    expect(validateProjectName("").valid).toBe(false);
    expect(validateProjectName("   ").valid).toBe(false);
  });

  it("rejects relative traversal dots", () => {
    expect(validateProjectName(".").valid).toBe(false);
    expect(validateProjectName("..").valid).toBe(false);
  });

  it("rejects invalid Windows characters", () => {
    const invalidNames = [
      "Project<1>",
      'Project"Name"',
      "Project:Test",
      "Project/Test",
      "Project\\Test",
      "Project|Pipe",
      "Project?Mark",
      "Project*Star"
    ];
    for (const name of invalidNames) {
      expect(validateProjectName(name).valid).toBe(false);
    }
  });

  it("rejects Windows reserved device names", () => {
    const reserved = ["CON", "PRN", "AUX", "NUL", "COM1", "LPT1", "con", "aux.txt"];
    for (const name of reserved) {
      expect(validateProjectName(name).valid).toBe(false);
    }
  });

  it("rejects trailing periods and spaces", () => {
    expect(validateProjectName("MyProject.").valid).toBe(false);
    expect(validateProjectName("MyProject ").valid).toBe(false);
  });

  it("sanitizes project names cleanly without changing case or valid spaces", () => {
    expect(sanitizeProjectName("Invoice: API")).toBe("Invoice API");
    expect(sanitizeProjectName("My   App  .")).toBe("My App");
    expect(sanitizeProjectName("CON")).toBe("CON_Project");
  });

  it("derives valid project names from markdown file paths", () => {
    expect(deriveProjectNameFromMarkdown("C:\\Downloads\\Invoice API.md")).toBe("Invoice API");
    expect(deriveProjectNameFromMarkdown("/home/user/docs/My Plan.MD")).toBe("My Plan");
    expect(() => deriveProjectNameFromMarkdown("invalid.txt")).toThrow();
  });
});
