import { describe, expect, it, beforeEach } from "bun:test";
import { handleKeyNavigation, type KeyNavigationActions } from "../../src/renderer/search";
import { store } from "../../src/renderer/state";
import type { Project } from "../../src/domain/types";

describe("Key Navigation Architecture", () => {
  const sampleProject: Project = {
    name: "Test Project",
    path: "C:\\Projects\\Test Project",
    type: "folder",
    exists: true,
    source: { antigravityRecent: true, projectsRoot: true },
    recentIndex: 0,
    note: "Initial note"
  };

  let opened = false;
  let newProjectOpened = false;
  let settingsOpened = false;
  let closedOrHidden = false;
  let noteFocused = false;
  let searchFocused = false;
  let searchCleared = false;

  let actions: KeyNavigationActions;

  beforeEach(() => {
    opened = false;
    newProjectOpened = false;
    settingsOpened = false;
    closedOrHidden = false;
    noteFocused = false;
    searchFocused = false;
    searchCleared = false;

    actions = {
      openSelected: () => { opened = true; },
      openNewProject: () => { newProjectOpened = true; },
      openSettings: () => { settingsOpened = true; },
      closeOrHide: () => { closedOrHidden = true; },
      focusNote: () => { noteFocused = true; },
      focusSearch: () => { searchFocused = true; },
      clearSearch: () => { searchCleared = true; }
    };

    store.setState({
      projects: [sampleProject],
      filteredProjects: [sampleProject],
      selectedIndex: 0,
      searchQuery: "",
      activeModal: "none"
    });
  });

  function createMockEvent(
    key: string,
    options: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; target?: any } = {}
  ): KeyboardEvent & { defaultPrevented: boolean } {
    let prevented = false;
    return {
      key,
      ctrlKey: !!options.ctrlKey,
      metaKey: !!options.metaKey,
      shiftKey: !!options.shiftKey,
      target: options.target || null,
      preventDefault: () => {
        prevented = true;
      },
      get defaultPrevented() {
        return prevented;
      }
    } as any;
  }

  it("allows standard Enter inside textarea without opening project or preventing default", () => {
    const mockTextarea = { tagName: "TEXTAREA", id: "project-note-input" };
    (globalThis as any).document = {
      activeElement: mockTextarea
    };

    const event = createMockEvent("Enter", { target: mockTextarea });
    handleKeyNavigation(event, actions);

    expect(opened).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });

  it("allows Arrow keys inside textarea without changing selectedIndex", () => {
    const mockTextarea = { tagName: "TEXTAREA", id: "project-note-input" };
    (globalThis as any).document = {
      activeElement: mockTextarea
    };

    const event = createMockEvent("ArrowDown", { target: mockTextarea });
    handleKeyNavigation(event, actions);

    expect(event.defaultPrevented).toBe(false);
    expect(store.getState().selectedIndex).toBe(0);
  });

  it("handles Ctrl+Enter inside textarea to quick-launch project", () => {
    const mockTextarea = { tagName: "TEXTAREA", id: "project-note-input" };
    (globalThis as any).document = {
      activeElement: mockTextarea
    };

    const event = createMockEvent("Enter", { ctrlKey: true, target: mockTextarea });
    handleKeyNavigation(event, actions);

    expect(opened).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it("handles Escape inside textarea to return focus to search", () => {
    const mockTextarea = { tagName: "TEXTAREA", id: "project-note-input" };
    (globalThis as any).document = {
      activeElement: mockTextarea
    };

    const event = createMockEvent("Escape", { target: mockTextarea });
    handleKeyNavigation(event, actions);

    expect(searchFocused).toBe(true);
    expect(closedOrHidden).toBe(false);
    expect(event.defaultPrevented).toBe(true);
  });

  it("opens selected project on Enter when outside textarea", () => {
    (globalThis as any).document = {
      activeElement: { id: "search-input" }
    };

    const event = createMockEvent("Enter");
    handleKeyNavigation(event, actions);

    expect(opened).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it("clears search query on Escape if search is not empty", () => {
    store.setState({ searchQuery: "test" });
    (globalThis as any).document = {
      activeElement: { id: "search-input" }
    };

    const event = createMockEvent("Escape");
    handleKeyNavigation(event, actions);

    expect(searchCleared).toBe(true);
    expect(closedOrHidden).toBe(false);
    expect(event.defaultPrevented).toBe(true);
  });

  it("closes/hides launcher on Escape if search is empty", () => {
    store.setState({ searchQuery: "" });
    (globalThis as any).document = {
      activeElement: { id: "search-input" }
    };

    const event = createMockEvent("Escape");
    handleKeyNavigation(event, actions);

    expect(closedOrHidden).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it("focuses note on Tab from search-input", () => {
    (globalThis as any).document = {
      activeElement: { id: "search-input" }
    };

    const event = createMockEvent("Tab");
    handleKeyNavigation(event, actions);

    expect(noteFocused).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it("triggers New Project modal on Ctrl+N", () => {
    (globalThis as any).document = {
      activeElement: { id: "search-input" }
    };

    const event = createMockEvent("n", { ctrlKey: true });
    handleKeyNavigation(event, actions);

    expect(newProjectOpened).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });
});
