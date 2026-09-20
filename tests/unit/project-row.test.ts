import { describe, expect, it, beforeEach } from "bun:test";
import { createProjectRowElement } from "../../src/renderer/components/project-row";
import type { Project } from "../../src/domain/types";

describe("Project Row Component", () => {
  const sampleProject: Project = {
    name: "Alpha Project",
    path: "C:\\Projects\\Alpha Project",
    type: "folder",
    exists: true,
    source: { antigravityRecent: true, projectsRoot: true },
    recentIndex: 0,
    description: "Main API engine",
    note: "Work in progress note"
  };

  const listeners: Record<string, Function[]> = {};

  beforeEach(() => {
    for (const key of Object.keys(listeners)) {
      delete listeners[key];
    }

    (globalThis as any).document = {
      createElement: (tag: string) => {
        const attrs: Record<string, string> = {};
        const elementListeners: Record<string, Function[]> = {};
        const el = {
          tagName: tag.toUpperCase(),
          className: "",
          innerHTML: "",
          setAttribute: (name: string, val: string) => {
            attrs[name] = val;
          },
          getAttribute: (name: string) => attrs[name],
          addEventListener: (event: string, handler: Function) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
            if (!elementListeners[event]) elementListeners[event] = [];
            elementListeners[event].push(handler);
          },
          dispatchEvent: (event: { type: string }) => {
            const handlers = elementListeners[event.type] || listeners[event.type] || [];
            for (const handler of handlers) {
              handler(event);
            }
          },
          querySelector: (selector: string) => {
            if (selector.includes("btn-row-pin")) {
              return {
                addEventListener: (event: string, handler: Function) => {
                  if (!listeners["pin:" + event]) listeners["pin:" + event] = [];
                  listeners["pin:" + event]?.push(handler);
                }
              };
            }
            return null;
          },
          querySelectorAll: (selector: string) => {
            return [];
          }
        };
        return el;
      }
    };
  });

  it("calls onSelect and does NOT call onOpen on single click", () => {
    let selectCalled = false;
    let openCalled = false;

    const row = createProjectRowElement(
      sampleProject,
      false,
      "",
      () => { selectCalled = true; },
      () => { openCalled = true; }
    );

    expect(listeners["click"]).toBeDefined();
    expect(listeners["click"]?.length).toBe(1);

    // Simulate single click
    row.dispatchEvent({ type: "click" } as any);

    expect(selectCalled).toBe(true);
    expect(openCalled).toBe(false);
  });

  it("calls onOpen on double click", () => {
    let selectCalled = false;
    let openCalled = false;

    const row = createProjectRowElement(
      sampleProject,
      false,
      "",
      () => { selectCalled = true; },
      () => { openCalled = true; }
    );

    expect(listeners["dblclick"]).toBeDefined();
    expect(listeners["dblclick"]?.length).toBe(1);

    // Simulate double click
    row.dispatchEvent({ type: "dblclick" } as any);

    expect(openCalled).toBe(true);
  });

  it("sets selected class and aria-selected correctly", () => {
    const selectedRow = createProjectRowElement(
      sampleProject,
      true,
      "",
      () => {},
      () => {}
    );

    expect(selectedRow.className).toContain("selected");
    expect((selectedRow as any).getAttribute("aria-selected")).toBe("true");

    const unselectedRow = createProjectRowElement(
      sampleProject,
      false,
      "",
      () => {},
      () => {}
    );

    expect(unselectedRow.className).not.toContain("selected");
    expect((unselectedRow as any).getAttribute("aria-selected")).toBe("false");
  });

  it("calls onSelect and onContextMenu on right click (contextmenu event)", () => {
    let selectCalled = false;
    let contextMenuTarget: any = null;

    const row = createProjectRowElement(
      sampleProject,
      false,
      "",
      () => { selectCalled = true; },
      () => {},
      (proj) => { contextMenuTarget = proj; }
    );

    expect(listeners["contextmenu"]).toBeDefined();
    const mockEvent = { type: "contextmenu", preventDefault: () => {} };
    row.dispatchEvent(mockEvent as any);

    expect(selectCalled).toBe(true);
    expect(contextMenuTarget).toBe(sampleProject);
  });

  it("does not render inline btn-row-pin button in row markup", () => {
    const row = createProjectRowElement(
      sampleProject,
      false,
      "",
      () => {},
      () => {}
    );

    expect(row.innerHTML).not.toContain("btn-row-pin");
  });

  it("renders pinned badge when project is pinned", () => {
    const pinnedProject = { ...sampleProject, pinned: true };
    const row = createProjectRowElement(
      pinnedProject,
      false,
      "",
      () => {},
      () => {}
    );

    expect(row.innerHTML).toContain("badge-pinned");
    expect(row.className).toContain("is-pinned");
  });
});
