import type { TimerAction } from "@/features/timer/timerEngine";

export type ShortcutCommand =
  | { type: "toggle" }
  | { type: "fullscreen" }
  | Extract<TimerAction, { type: "RESET" | "ADD_TIME" }>;

export function commandForKey(key: string): ShortcutCommand | null {
  switch (key) {
    case " ":
      return { type: "toggle" };
    case "r":
      return { type: "RESET" };
    case "f":
      return { type: "fullscreen" };
    case "5":
      return { type: "ADD_TIME", minutes: 5 };
    case "1":
      return { type: "ADD_TIME", minutes: 10 };
    case "2":
      return { type: "ADD_TIME", minutes: 15 };
    default:
      return null;
  }
}

export function shouldIgnoreShortcut(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  return Boolean(
    target.closest("input, textarea, select, button, a, [contenteditable='true']"),
  );
}
