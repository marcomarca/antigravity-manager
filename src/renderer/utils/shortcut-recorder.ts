export interface ParsedShortcut {
  isModifierOnly: boolean;
  isClearKey: boolean;
  shortcut: string;
  modifierPrefix: string;
}

export interface ShortcutRecorderOptions {
  defaultValue?: string;
  allowClear?: boolean;
  resetBtn?: HTMLButtonElement | null;
  onCapture?: (shortcut: string) => void;
  onClear?: () => void;
}

const CODE_TO_BASE_KEY: Record<string, string> = {
  Space: "Space",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backquote: "`",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  Insert: "Insert"
};

/**
 * Parses a KeyboardEvent into canonical shortcut representation.
 */
export function parseKeyboardEventToShortcut(e: KeyboardEvent): ParsedShortcut {
  const isCtrl = Boolean(e.ctrlKey || e.metaKey);
  const isAlt = Boolean(e.altKey);
  const isShift = Boolean(e.shiftKey);

  const modifiers: string[] = [];
  if (isCtrl) modifiers.push("Ctrl");
  if (isAlt) modifiers.push("Alt");
  if (isShift) modifiers.push("Shift");

  const modifierPrefix = modifiers.length > 0 ? `${modifiers.join("+")}+...` : "";

  // Check if it's a modifier key by itself
  const keyLower = e.key.toLowerCase();
  const isModifierOnly =
    keyLower === "control" ||
    keyLower === "alt" ||
    keyLower === "shift" ||
    keyLower === "meta";

  if (isModifierOnly) {
    return {
      isModifierOnly: true,
      isClearKey: false,
      shortcut: "",
      modifierPrefix
    };
  }

  // Clear keys (Backspace / Delete) without modifiers
  if ((keyLower === "backspace" || keyLower === "delete") && modifiers.length === 0) {
    return {
      isModifierOnly: false,
      isClearKey: true,
      shortcut: "",
      modifierPrefix: ""
    };
  }

  // Extract base key
  let baseKey = "";

  // Letters (KeyA - KeyZ)
  if (e.code.startsWith("Key") && e.code.length === 4) {
    baseKey = e.code.slice(3).toUpperCase();
  }
  // Digits (Digit0 - Digit9)
  else if (e.code.startsWith("Digit") && e.code.length === 6) {
    baseKey = e.code.slice(5);
  }
  // Numpad Digits (Numpad0 - Numpad9)
  else if (e.code.startsWith("Numpad") && /^[0-9]$/.test(e.code.slice(6))) {
    baseKey = e.code.slice(6);
  }
  // Function keys (F1 - F24)
  else if (/^F([1-9]|1[0-9]|2[0-4])$/i.test(e.key)) {
    baseKey = e.key.toUpperCase();
  }
  // Mapped keys
  else if (CODE_TO_BASE_KEY[e.code]) {
    baseKey = CODE_TO_BASE_KEY[e.code]!;
  }
  // Special keys like Enter
  else if (keyLower === "enter") {
    baseKey = "Enter";
  } else if (keyLower === "tab") {
    baseKey = "Tab";
  } else if (e.key === " " || e.code === "Space") {
    baseKey = "Space";
  } else if (e.key.length === 1) {
    baseKey = e.key.toUpperCase();
  } else {
    baseKey = e.key;
  }

  const parts = [...modifiers, baseKey];
  const shortcut = parts.join("+");

  return {
    isModifierOnly: false,
    isClearKey: false,
    shortcut,
    modifierPrefix
  };
}

/**
 * Attaches interactive shortcut recording behavior to an input element.
 */
export function setupShortcutRecorder(
  input: HTMLInputElement,
  options: ShortcutRecorderOptions = {}
): () => void {
  const { defaultValue = "", resetBtn, onCapture, onClear } = options;

  let previousValue = input.value;
  let isRecording = false;

  // Mark input as readonly to prevent arbitrary textual typing
  input.readOnly = true;
  input.classList.add("shortcut-recorder-input");

  const startRecording = () => {
    isRecording = true;
    previousValue = input.value;
    input.classList.add("recording");
    input.parentElement?.classList.add("recording");
    input.setAttribute("data-recording-placeholder", input.placeholder || "");
    input.placeholder = "Press shortcut keys...";
  };

  const stopRecording = (restorePrevious = false) => {
    isRecording = false;
    input.classList.remove("recording");
    input.parentElement?.classList.remove("recording");
    const origPlaceholder = input.getAttribute("data-recording-placeholder");
    if (origPlaceholder !== null) {
      input.placeholder = origPlaceholder;
    }
    if (restorePrevious) {
      input.value = previousValue;
    }
  };

  const handleFocus = () => {
    startRecording();
  };

  const handleBlur = () => {
    if (isRecording) {
      // If left in an incomplete modifier state, restore previous
      if (input.value.endsWith("+...") || input.value === "Press shortcut keys...") {
        stopRecording(true);
      } else {
        stopRecording(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isRecording) return;

    // Normal Tab / Shift+Tab navigation: allow standard blur/focus behavior
    if (e.key === "Tab" && !e.ctrlKey && !e.altKey && !e.metaKey) {
      stopRecording(false);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Escape cancels recording and restores previous value
    if (e.key === "Escape") {
      stopRecording(true);
      input.blur();
      return;
    }

    const parsed = parseKeyboardEventToShortcut(e);

    // Clear key (Backspace / Delete without modifiers)
    if (parsed.isClearKey) {
      input.value = "";
      stopRecording(false);
      try {
        if (typeof Event !== "undefined") {
          input.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
          input.dispatchEvent({ type: "change", bubbles: true } as any);
        }
      } catch {}
      onClear?.();
      onCapture?.("");
      input.blur();
      return;
    }

    // Modifier only: show pending state
    if (parsed.isModifierOnly) {
      if (parsed.modifierPrefix) {
        input.value = parsed.modifierPrefix;
      }
      return;
    }

    // Valid combination with a base key
    if (parsed.shortcut) {
      input.value = parsed.shortcut;
      stopRecording(false);
      input.classList.add("captured");
      if (typeof setTimeout !== "undefined") {
        const timer = setTimeout(() => input.classList.remove("captured"), 400);
        if (timer && typeof timer === "object" && "unref" in timer) {
          (timer as any).unref();
        }
      }

      try {
        if (typeof Event !== "undefined") {
          input.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
          input.dispatchEvent({ type: "change", bubbles: true } as any);
        }
      } catch {}
      onCapture?.(parsed.shortcut);
      input.blur();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (!isRecording) return;
    const isCtrl = Boolean(e.ctrlKey || e.metaKey);
    const isAlt = Boolean(e.altKey);
    const isShift = Boolean(e.shiftKey);

    if (isCtrl || isAlt || isShift) {
      const activeMods: string[] = [];
      if (isCtrl) activeMods.push("Ctrl");
      if (isAlt) activeMods.push("Alt");
      if (isShift) activeMods.push("Shift");
      input.value = `${activeMods.join("+")}+...`;
    } else if (input.value.endsWith("+...")) {
      input.value = previousValue;
    }
  };

  input.addEventListener("focus", handleFocus);
  input.addEventListener("blur", handleBlur);
  input.addEventListener("keydown", handleKeyDown);
  input.addEventListener("keyup", handleKeyUp);

  // Reset button support
  let handleResetClick: (() => void) | null = null;
  if (resetBtn) {
    handleResetClick = (ev?: MouseEvent) => {
      ev?.preventDefault?.();
      input.value = defaultValue;
      stopRecording(false);
      try {
        if (typeof Event !== "undefined") {
          input.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
          input.dispatchEvent({ type: "change", bubbles: true } as any);
        }
      } catch {}
      onCapture?.(defaultValue);
    };
    resetBtn.addEventListener("click", handleResetClick);
  }

  // Return cleanup function
  return () => {
    input.removeEventListener("focus", handleFocus);
    input.removeEventListener("blur", handleBlur);
    input.removeEventListener("keydown", handleKeyDown);
    input.removeEventListener("keyup", handleKeyUp);
    if (resetBtn && handleResetClick) {
      resetBtn.removeEventListener("click", handleResetClick);
    }
  };
}
