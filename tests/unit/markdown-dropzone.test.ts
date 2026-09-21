import { describe, it, expect, beforeEach } from "bun:test";
import { setupMarkdownDropzones } from "../../src/renderer/components/markdown-dropzone";
import { handleKeyNavigation, type KeyNavigationActions } from "../../src/renderer/search";
import { store } from "../../src/renderer/state";

class MockDomElement {
  private classes = new Set<string>();
  public classList = {
    add: (cls: string) => this.classes.add(cls),
    remove: (cls: string) => this.classes.delete(cls),
    contains: (cls: string) => this.classes.has(cls)
  };
  private listeners: Record<string, Function[]> = {};

  addEventListener(type: string, fn: Function) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  removeEventListener(type: string, fn: Function) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((l) => l !== fn);
  }

  dispatchEvent(event: any) {
    const list = this.listeners[event.type] || [];
    for (const fn of list) {
      fn(event);
    }
  }
}

describe("Markdown Dropzone Architecture & State Recovery", () => {
  let globalDropzone: MockDomElement;
  let modalDropzone: MockDomElement;
  let toasts: string[] = [];

  let windowListeners: Record<string, Function[]> = {};

  beforeEach(() => {
    toasts = [];
    globalDropzone = new MockDomElement();
    globalDropzone.classList.add("hidden");
    modalDropzone = new MockDomElement();

    windowListeners = {};
    (globalThis as any).window = {
      addEventListener: (type: string, fn: Function) => {
        if (!windowListeners[type]) windowListeners[type] = [];
        windowListeners[type].push(fn);
      },
      removeEventListener: (type: string, fn: Function) => {
        if (!windowListeners[type]) return;
        windowListeners[type] = windowListeners[type].filter((l) => l !== fn);
      },
      dispatchEvent: (event: any) => {
        const list = windowListeners[event.type] || [];
        for (const fn of list) {
          fn(event);
        }
      },
      app: {
        utils: {
          getPathForFile: (f: any) => `C:\\path\\${f.name}`
        },
        projects: {
          importMarkdown: async () => ({})
        },
        window: {
          hide: async () => {}
        }
      }
    };

    store.setState({
      activeModal: "none",
      collisionContext: null,
      projects: [],
      filteredProjects: [],
      searchQuery: ""
    });
  });

  const triggerWindowEvent = (type: string, payload: any = {}) => {
    const event = {
      type,
      defaultPrevented: false,
      stoppedPropagation: false,
      preventDefault: () => { event.defaultPrevented = true; },
      stopPropagation: () => { event.stoppedPropagation = true; },
      ...payload
    };
    const list = windowListeners[type] || [];
    for (const fn of list) {
      fn(event);
    }
    return event;
  };

  it("activates global dropzone on window dragenter when files are dragged and no modal is open", () => {
    const ctrl = setupMarkdownDropzones(globalDropzone as any, modalDropzone as any, (m) => toasts.push(m));
    expect(ctrl.isVisible()).toBe(false);

    triggerWindowEvent("dragenter", {
      dataTransfer: { types: ["Files"] }
    });

    expect(globalDropzone.classList.contains("hidden")).toBe(false);
    expect(ctrl.isVisible()).toBe(true);
  });

  it("does not activate global dropzone on window dragenter if a modal is open", () => {
    store.setState({ activeModal: "new_project" });
    const ctrl = setupMarkdownDropzones(globalDropzone as any, modalDropzone as any, (m) => toasts.push(m));

    triggerWindowEvent("dragenter", {
      dataTransfer: { types: ["Files"] }
    });

    expect(globalDropzone.classList.contains("hidden")).toBe(true);
    expect(ctrl.isVisible()).toBe(false);
  });

  it("hides global dropzone when drag leaves the window", () => {
    const ctrl = setupMarkdownDropzones(globalDropzone as any, modalDropzone as any, (m) => toasts.push(m));

    triggerWindowEvent("dragenter", {
      dataTransfer: { types: ["Files"] }
    });
    expect(ctrl.isVisible()).toBe(true);

    triggerWindowEvent("dragleave");
    expect(ctrl.isVisible()).toBe(false);
    expect(globalDropzone.classList.contains("hidden")).toBe(true);
  });

  it("resets and hides global dropzone when dropped on modal dropzone", async () => {
    const ctrl = setupMarkdownDropzones(globalDropzone as any, modalDropzone as any, (m) => toasts.push(m));

    // Simulate global dropzone somehow activated
    globalDropzone.classList.remove("hidden");
    expect(ctrl.isVisible()).toBe(true);

    // Drop on modalDropzone
    const fakeFile = { name: "test.md" };
    modalDropzone.dispatchEvent({
      type: "drop",
      preventDefault: () => {},
      stopPropagation: () => {},
      dataTransfer: { files: [fakeFile] }
    });

    expect(globalDropzone.classList.contains("hidden")).toBe(true);
    expect(ctrl.isVisible()).toBe(false);
  });

  it("resets and hides global dropzone on window blur", () => {
    const ctrl = setupMarkdownDropzones(globalDropzone as any, modalDropzone as any, (m) => toasts.push(m));

    globalDropzone.classList.remove("hidden");
    expect(ctrl.isVisible()).toBe(true);

    triggerWindowEvent("blur");

    expect(ctrl.isVisible()).toBe(false);
    expect(globalDropzone.classList.contains("hidden")).toBe(true);
  });

  it("resets and hides global dropzone on Escape key", () => {
    const ctrl = setupMarkdownDropzones(globalDropzone as any, modalDropzone as any, (m) => toasts.push(m));

    globalDropzone.classList.remove("hidden");
    expect(ctrl.isVisible()).toBe(true);

    const escEvent = triggerWindowEvent("keydown", { key: "Escape" });
    expect(escEvent.defaultPrevented).toBe(true);
    expect(escEvent.stoppedPropagation).toBe(true);
    expect(ctrl.isVisible()).toBe(false);
    expect(globalDropzone.classList.contains("hidden")).toBe(true);
  });

  it("resets and hides global dropzone when clicking on the overlay", () => {
    const ctrl = setupMarkdownDropzones(globalDropzone as any, modalDropzone as any, (m) => toasts.push(m));

    globalDropzone.classList.remove("hidden");
    expect(ctrl.isVisible()).toBe(true);

    globalDropzone.dispatchEvent({ type: "click" });

    expect(ctrl.isVisible()).toBe(false);
    expect(globalDropzone.classList.contains("hidden")).toBe(true);
  });

  it("integrates with handleKeyNavigation: dismisses dropzone on Escape without closing launcher", () => {
    const ctrl = setupMarkdownDropzones(globalDropzone as any, modalDropzone as any, (m) => toasts.push(m));

    globalDropzone.classList.remove("hidden");
    expect(ctrl.isVisible()).toBe(true);

    let closedWindow = false;
    const actions: KeyNavigationActions = {
      openSelected: () => {},
      openNewProject: () => {},
      openSettings: () => {},
      closeOrHide: () => { closedWindow = true; },
      dismissDropzone: () => {
        if (ctrl.isVisible()) {
          ctrl.hide();
          return true;
        }
        return false;
      }
    };

    let prevented = false;
    const mockEscEvent = {
      key: "Escape",
      preventDefault: () => { prevented = true; }
    } as any;

    handleKeyNavigation(mockEscEvent, actions);

    expect(prevented).toBe(true);
    expect(closedWindow).toBe(false); // Window was NOT closed
    expect(ctrl.isVisible()).toBe(false); // Dropzone was dismissed
  });
});
