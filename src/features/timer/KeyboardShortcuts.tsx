"use client";

import { useToast } from "@/components/ui/toast";
import { useGuestApp } from "@/features/app/GuestAppProvider";
import { useFullscreen } from "@/features/timer/FullscreenContext";
import { commandForKey, shouldIgnoreShortcut } from "@/features/timer/shortcuts";
import { useEffect } from "react";

export function KeyboardShortcuts() {
  const { timer, dispatchTimer } = useGuestApp();
  const { toggleFullscreen } = useFullscreen();
  const { notify } = useToast();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.isComposing) {
        return;
      }
      if (shouldIgnoreShortcut(event.target)) {
        return;
      }
      const key = event.key === " " ? " " : event.key.toLowerCase();
      const command = commandForKey(key);
      if (!command) {
        return;
      }
      event.preventDefault();
      if (command.type === "toggle") {
        dispatchTimer({
          type:
            timer.status === "running" ? "PAUSE" : timer.status === "paused" ? "RESUME" : "START",
        });
        return;
      }
      if (command.type === "fullscreen") {
        void toggleFullscreen().then((ok) => {
          if (!ok) {
            notify("Fullscreen is available from the timer.");
          }
        });
        return;
      }
      dispatchTimer(command);
      if (command.type === "ADD_TIME") {
        notify(`+${command.minutes}:00 added`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatchTimer, notify, timer.status, toggleFullscreen]);

  return null;
}
