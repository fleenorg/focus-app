"use client";

import { cn } from "@/lib/cn";
import { formatCountdown, sessionLabel } from "@/lib/time";
import type { ClockFaceProps } from "./types";

export function ClassicClock({
  remainingMs,
  durationMs,
  status,
  sessionType,
  ready,
  size,
}: ClockFaceProps) {
  const progress = durationMs === 0 ? 0 : 1 - remainingMs / durationMs;
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));
  const immersive = size === "immersive";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        immersive
          ? "h-[min(84vmin,44rem)] w-[min(84vmin,44rem)]"
          : "h-64 w-64 sm:h-72 sm:w-72",
      )}
      aria-live="off"
    >
      <svg className="h-full w-full -rotate-90" viewBox="0 0 240 240" aria-hidden="true">
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth="8"
        />
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-accent transition-[stroke-dashoffset] duration-200"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={ready ? offset : circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          {sessionLabel(sessionType)}
        </p>
        <p
          className={cn(
            "mt-1 font-mono font-medium tracking-tight text-foreground",
            immersive
              ? "text-[clamp(5rem,13vmin,9.5rem)]"
              : "text-6xl sm:text-7xl",
          )}
          aria-label={`${sessionLabel(sessionType)} remaining ${
            ready ? formatCountdown(remainingMs) : "not ready"
          }`}
        >
          {ready ? formatCountdown(remainingMs) : "--:--"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {status === "running" ? "In progress" : status === "paused" ? "Paused" : "Ready"}
        </p>
      </div>
    </div>
  );
}
