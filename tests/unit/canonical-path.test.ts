import { describe, expect, it } from "bun:test";
import {
  assertInsideProjectsRoot,
  canonicalPathKey,
  normalizePath
} from "../../src/domain/canonical-path";

describe("Canonical Path & Containment", () => {
  it("normalizes paths to standard Windows backslashes", () => {
    expect(normalizePath("C:/Users/User/Projects/App/")).toBe("C:\\Users\\User\\Projects\\App");
    expect(normalizePath("D:\\Clients\\Website\\\\")).toBe("D:\\Clients\\Website");
  });

  it("produces lowercase canonical comparison keys", () => {
    const p1 = canonicalPathKey("C:\\Projects\\App");
    const p2 = canonicalPathKey("c:/projects/app/");
    expect(p1).toBe(p2);
  });

  it("asserts target path is strictly inside projectsRoot", () => {
    const root = "C:\\Users\\User\\Projects";
    const validTarget = "C:\\Users\\User\\Projects\\App1";
    expect(() => assertInsideProjectsRoot(validTarget, root)).not.toThrow();

    const escapingTarget = "C:\\Users\\User\\Projects\\..\\Windows";
    expect(() => assertInsideProjectsRoot(escapingTarget, root)).toThrow();

    const sameAsRoot = "C:\\Users\\User\\Projects";
    expect(() => assertInsideProjectsRoot(sameAsRoot, root)).toThrow();

    const differentDrive = "D:\\Projects\\App1";
    expect(() => assertInsideProjectsRoot(differentDrive, root)).toThrow();

    const nestedTarget = "C:\\Users\\User\\Projects\\Sub\\Nested";
    expect(() => assertInsideProjectsRoot(nestedTarget, root)).toThrow();
  });
});
