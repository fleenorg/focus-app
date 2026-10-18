"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGuestApp } from "@/features/app/GuestAppProvider";
import { cn } from "@/lib/cn";
import { formatCountdown, sessionLabel } from "@/lib/time";
import type { SessionType } from "@/types/domain";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

const MODES: SessionType[] = ["focus", "shortBreak", "longBreak"];

export function TimerPanel() {
  const { timer, dispatchTimer, tasks, activeTaskId, ready } = useGuestApp();
  const activeTask = tasks.find((task) => task.id === activeTaskId);
  const progress =
    timer.durationMs === 0 ? 0 : 1 - timer.remainingMs / timer.durationMs;
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));
  const primaryLabel =
    timer.status === "running" ? "Pause" : timer.status === "paused" ? "Resume" : "Start";

  return (
    <Card className="px-6 py-8 sm:px-10">
      <div className="flex flex-col items-center">
        <div
          className="mb-6 grid w-full grid-cols-3 gap-1 rounded-full bg-background p-1"
          role="tablist"
          aria-label="Session type"
        >
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={timer.sessionType === mode}
              onClick={() => dispatchTimer({ type: "SET_SESSION", sessionType: mode })}
              className={cn(
                "rounded-full px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm",
                timer.sessionType === mode
                  ? "bg-surface-2 text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {sessionLabel(mode)}
            </button>
          ))}
        </div>

        <div
          className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72"
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
              {sessionLabel(timer.sessionType)}
            </p>
            <p
              className="mt-1 font-mono text-6xl font-medium tracking-tight text-foreground sm:text-7xl"
              aria-label={`${sessionLabel(timer.sessionType)} remaining ${formatCountdown(timer.remainingMs)}`}
            >
              {ready ? formatCountdown(timer.remainingMs) : "--:--"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {timer.status === "running"
                ? "In progress"
                : timer.status === "paused"
                  ? "Paused"
                  : "Ready"}
            </p>
          </div>
        </div>

        <p className="mt-4 min-h-6 text-center text-sm text-muted">
          {activeTask
            ? `Working on ${activeTask.title}`
            : "No task selected"}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() =>
              dispatchTimer({
                type:
                  timer.status === "running"
                    ? "PAUSE"
                    : timer.status === "paused"
                      ? "RESUME"
                      : "START",
              })
            }
          >
            {timer.status === "running" ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
            {primaryLabel}
          </Button>
          <Button
            variant="secondary"
            onClick={() => dispatchTimer({ type: "RESET" })}
            aria-label="Reset timer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
          <Button
            variant="ghost"
            onClick={() => dispatchTimer({ type: "SKIP" })}
            aria-label="Skip to next session"
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" />
            Skip
          </Button>
        </div>
      </div>
    </Card>
  );
}
