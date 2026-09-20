import { describe, it, expect, beforeEach } from "bun:test";
import {
  parseKeyboardEventToShortcut,
  setupShortcutRecorder
} from "../../src/renderer/utils/shortcut-recorder";

interface MockEventInit {
  key: string;
  code?: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

function createMockKeyEvent(init: MockEventInit): KeyboardEvent & { defaultPrevented: boolean; stoppedPropagation: boolean } {
  let prevented = false;
  let stopped = false;
  const key = init.key;
  const code = init.code || (key.length === 1 && /[a-zA-Z]/.test(key) ? `Key${key.toUpperCase()}` : key);

  return {
    type: "keydown",
    key,
    code,
    ctrlKey: Boolean(init.ctrlKey),
    shiftKey: Boolean(init.shiftKey),
    altKey: Boolean(init.altKey),
    metaKey: Boolean(init.metaKey),
    preventDefault: () => {
      prevented = true;
    },
    stopPropagation: () => {
      stopped = true;
    },
    get defaultPrevented() {
      return prevented;
    },
    get stoppedPropagation() {
      return stopped;
    }
  } as any;
}

class MockElement {
  public value = "";
  public placeholder = "";
  public readOnly = false;
  private classes = new Set<string>();
  public classList = {
    add: (cls: string) => this.classes.add(cls),
    remove: (cls: string) => this.classes.delete(cls),
    contains: (cls: string) => this.classes.has(cls)
  };
  public parentElement: MockElement | null = null;
  private attributes: Record<string, string> = {};
  private listeners: Record<string, Function[]> = {};

  constructor(public tagName = "DIV") {}

  public setAttribute(name: string, val: string): void {
    this.attributes[name] = val;
  }

  public getAttribute(name: string): string | null {
    return this.attributes[name] ?? null;
  }

  public addEventListener(event: string, handler: Function): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(handler);
  }

  public removeEventListener(event: string, handler: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter((h) => h !== handler);
  }

  public dispatchEvent(event: any): boolean {
    const handlers = (this.listeners[event.type] || []).slice();
    for (const h of handlers) {
      h(event);
    }
    return true;
  }

  public focus(): void {
    this.dispatchEvent({ type: "focus" });
  }

  public blur(): void {
    this.dispatchEvent({ type: "blur" });
  }

  public click(): void {
    this.dispatchEvent({ type: "click" });
  }
}

describe("parseKeyboardEventToShortcut", () => {
  it("identifies single modifier keys correctly", () => {
    const ctrlEvent = createMockKeyEvent({ key: "Control", ctrlKey: true });
    const parsedCtrl = parseKeyboardEventToShortcut(ctrlEvent);
    expect(parsedCtrl.isModifierOnly).toBe(true);
    expect(parsedCtrl.modifierPrefix).toBe("Ctrl+...");
    expect(parsedCtrl.shortcut).toBe("");

    const altEvent = createMockKeyEvent({ key: "Alt", altKey: true });
    const parsedAlt = parseKeyboardEventToShortcut(altEvent);
    expect(parsedAlt.isModifierOnly).toBe(true);
    expect(parsedAlt.modifierPrefix).toBe("Alt+...");

    const shiftEvent = createMockKeyEvent({ key: "Shift", shiftKey: true });
    const parsedShift = parseKeyboardEventToShortcut(shiftEvent);
    expect(parsedShift.isModifierOnly).toBe(true);
    expect(parsedShift.modifierPrefix).toBe("Shift+...");

    const multiModEvent = createMockKeyEvent({ key: "Shift", ctrlKey: true, shiftKey: true });
    const parsedMulti = parseKeyboardEventToShortcut(multiModEvent);
    expect(parsedMulti.isModifierOnly).toBe(true);
    expect(parsedMulti.modifierPrefix).toBe("Ctrl+Shift+...");
  });

  it("identifies standalone clear keys (Backspace and Delete)", () => {
    const backspace = createMockKeyEvent({ key: "Backspace" });
    const parsedBackspace = parseKeyboardEventToShortcut(backspace);
    expect(parsedBackspace.isClearKey).toBe(true);
    expect(parsedBackspace.shortcut).toBe("");

    const del = createMockKeyEvent({ key: "Delete" });
    const parsedDel = parseKeyboardEventToShortcut(del);
    expect(parsedDel.isClearKey).toBe(true);
    expect(parsedDel.shortcut).toBe("");
  });

  it("does not treat Backspace with Ctrl as a standalone clear key", () => {
    const ctrlBackspace = createMockKeyEvent({ key: "Backspace", ctrlKey: true });
    const parsed = parseKeyboardEventToShortcut(ctrlBackspace);
    expect(parsed.isClearKey).toBe(false);
    expect(parsed.shortcut).toBe("Ctrl+Backspace");
  });

  it("parses letter combinations in uppercase canonical format", () => {
    const ctrlShiftP = createMockKeyEvent({ key: "p", ctrlKey: true, shiftKey: true, code: "KeyP" });
    expect(parseKeyboardEventToShortcut(ctrlShiftP).shortcut).toBe("Ctrl+Shift+P");

    const ctrlShiftC = createMockKeyEvent({ key: "c", ctrlKey: true, shiftKey: true, code: "KeyC" });
    expect(parseKeyboardEventToShortcut(ctrlShiftC).shortcut).toBe("Ctrl+Shift+C");

    const altF = createMockKeyEvent({ key: "f", altKey: true, code: "KeyF" });
    expect(parseKeyboardEventToShortcut(altF).shortcut).toBe("Alt+F");
  });

  it("parses Space key accurately from code or key", () => {
    const ctrlAltSpace = createMockKeyEvent({ key: " ", ctrlKey: true, altKey: true, code: "Space" });
    expect(parseKeyboardEventToShortcut(ctrlAltSpace).shortcut).toBe("Ctrl+Alt+Space");

    const spaceAlone = createMockKeyEvent({ key: "Space", code: "Space" });
    expect(parseKeyboardEventToShortcut(spaceAlone).shortcut).toBe("Space");
  });

  it("parses Function keys correctly", () => {
    const f5 = createMockKeyEvent({ key: "F5" });
    expect(parseKeyboardEventToShortcut(f5).shortcut).toBe("F5");

    const ctrlF12 = createMockKeyEvent({ key: "F12", ctrlKey: true });
    expect(parseKeyboardEventToShortcut(ctrlF12).shortcut).toBe("Ctrl+F12");
  });

  it("parses navigation keys in canonical titlecase", () => {
    const ctrlUp = createMockKeyEvent({ key: "ArrowUp", ctrlKey: true, code: "ArrowUp" });
    expect(parseKeyboardEventToShortcut(ctrlUp).shortcut).toBe("Ctrl+Up");

    const altLeft = createMockKeyEvent({ key: "ArrowLeft", altKey: true, code: "ArrowLeft" });
    expect(parseKeyboardEventToShortcut(altLeft).shortcut).toBe("Alt+Left");
  });

  it("parses digits correctly", () => {
    const ctrl1 = createMockKeyEvent({ key: "1", ctrlKey: true, code: "Digit1" });
    expect(parseKeyboardEventToShortcut(ctrl1).shortcut).toBe("Ctrl+1");
  });
});

describe("setupShortcutRecorder DOM interaction", () => {
  let mockInput: any;
  let mockResetBtn: any;

  beforeEach(() => {
    const parent = new MockElement("DIV");
    const input = new MockElement("INPUT");
    input.parentElement = parent;
    input.value = "Ctrl+Shift+P";
    mockInput = input;

    mockResetBtn = new MockElement("BUTTON");
  });

  it("sets up input properties and enters recording on focus", () => {
    setupShortcutRecorder(mockInput, { defaultValue: "Ctrl+Shift+P", resetBtn: mockResetBtn });
    expect(mockInput.readOnly).toBe(true);
    expect(mockInput.classList.contains("shortcut-recorder-input")).toBe(true);

    mockInput.focus();
    expect(mockInput.classList.contains("recording")).toBe(true);
    expect(mockInput.placeholder).toBe("Press shortcut keys...");
  });

  it("captures full key combination and blurs input", () => {
    let captured = "";
    setupShortcutRecorder(mockInput, {
      defaultValue: "Ctrl+Shift+P",
      onCapture: (val) => { captured = val; }
    });

    mockInput.focus();
    const event = createMockKeyEvent({ key: "k", ctrlKey: true, altKey: true, code: "KeyK" });
    mockInput.dispatchEvent(event);

    expect(mockInput.value).toBe("Ctrl+Alt+K");
    expect(captured).toBe("Ctrl+Alt+K");
    expect(mockInput.classList.contains("recording")).toBe(false);
  });

  it("restores previous value on Escape", () => {
    setupShortcutRecorder(mockInput, { defaultValue: "Ctrl+Shift+P" });
    mockInput.value = "Ctrl+Shift+P";

    mockInput.focus();
    // Typing modifier alone
    const modEvent = createMockKeyEvent({ key: "Control", ctrlKey: true });
    mockInput.dispatchEvent(modEvent);
    expect(mockInput.value).toBe("Ctrl+...");

    // Press Escape
    const escEvent = createMockKeyEvent({ key: "Escape" });
    mockInput.dispatchEvent(escEvent);

    expect(mockInput.value).toBe("Ctrl+Shift+P");
    expect(mockInput.classList.contains("recording")).toBe(false);
  });

  it("clears shortcut on standalone Backspace or Delete", () => {
    let cleared = false;
    setupShortcutRecorder(mockInput, {
      defaultValue: "Ctrl+Shift+P",
      onClear: () => { cleared = true; }
    });

    mockInput.focus();
    const backspaceEvent = createMockKeyEvent({ key: "Backspace" });
    mockInput.dispatchEvent(backspaceEvent);

    expect(mockInput.value).toBe("");
    expect(cleared).toBe(true);
    expect(mockInput.classList.contains("recording")).toBe(false);
  });

  it("allows normal Tab navigation without recording Tab", () => {
    setupShortcutRecorder(mockInput, { defaultValue: "Ctrl+Shift+P" });
    mockInput.focus();

    const tabEvent = createMockKeyEvent({ key: "Tab" });
    mockInput.dispatchEvent(tabEvent);

    expect(tabEvent.defaultPrevented).toBe(false);
    expect(mockInput.value).toBe("Ctrl+Shift+P");
  });

  it("restores default value when reset button is clicked", () => {
    let captured = "";
    setupShortcutRecorder(mockInput, {
      defaultValue: "Ctrl+Shift+P",
      resetBtn: mockResetBtn,
      onCapture: (val) => { captured = val; }
    });

    mockInput.value = "Ctrl+Alt+K";
    mockResetBtn.click();

    expect(mockInput.value).toBe("Ctrl+Shift+P");
    expect(captured).toBe("Ctrl+Shift+P");
  });

  it("cleans up event listeners on unmount", () => {
    const cleanup = setupShortcutRecorder(mockInput, { defaultValue: "Ctrl+Shift+P", resetBtn: mockResetBtn });
    cleanup();

    mockInput.focus();
    expect(mockInput.classList.contains("recording")).toBe(false);
  });
});
