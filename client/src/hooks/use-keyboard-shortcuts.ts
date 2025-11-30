import { useEffect, useCallback } from "react";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Only allow Escape key in input fields
        if (event.key !== "Escape") {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Common keyboard shortcuts that can be used across the app
export const KEYBOARD_SHORTCUTS = {
  FOCUS_CHAT: { key: "/", description: "Focus chat input" },
  NEW_CHAT: { key: "n", ctrl: true, description: "New chat" },
  TOGGLE_SIDEBAR: { key: "b", ctrl: true, description: "Toggle sidebar" },
  TOGGLE_MODE: { key: "m", ctrl: true, shift: true, description: "Toggle Dev/HR mode" },
  GO_HOME: { key: "h", ctrl: true, shift: true, description: "Go to Home/Chat" },
  GO_PROJECTS: { key: "p", ctrl: true, shift: true, description: "Go to Projects" },
  GO_TEMPLATES: { key: "t", ctrl: true, shift: true, description: "Go to Templates" },
  GO_SETTINGS: { key: ",", ctrl: true, description: "Go to Settings" },
  SHOW_SHORTCUTS: { key: "?", shift: true, description: "Show keyboard shortcuts" },
} as const;
