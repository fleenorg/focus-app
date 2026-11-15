"use client";

import { useGuestApp } from "@/features/app/GuestAppProvider";
import { cn } from "@/lib/cn";
import { Moon, Sun } from "lucide-react";
import { useRef } from "react";

export function ThemeToggle() {
  const { settings, updateSettings } = useGuestApp();
  const timeoutRef = useRef<number | undefined>(undefined);
  const isLight = settings.theme === "light";

  const toggle = () => {
    const root = document.documentElement;
    // Turn on the slow color fade, then turn it off again after it finishes.
    root.classList.add("theme-transition");
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 1100);
    updateSettings({ ...settings, theme: isLight ? "dark" : "light" });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label="Light mode"
      onClick={toggle}
      className="relative h-8 w-14 shrink-0 rounded-full border border-border bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-background transition-transform duration-500 ease-in-out",
          isLight && "translate-x-6",
        )}
      >
        <Moon
          aria-hidden="true"
          className={cn(
            "absolute h-4 w-4 transition-all duration-500",
            isLight ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
        />
        <Sun
          aria-hidden="true"
          className={cn(
            "absolute h-4 w-4 transition-all duration-500",
            isLight ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
          )}
        />
      </span>
    </button>
  );
}