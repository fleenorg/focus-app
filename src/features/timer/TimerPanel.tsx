"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useGuestApp } from "@/features/app/GuestAppProvider";
import { SoundscapeControl } from "@/features/soundscapes/SoundscapeControl";
import { ClockDisplay } from "@/features/timer/clocks/ClockDisplay";
import { useFullscreen } from "@/features/timer/FullscreenContext";
import { QuickAddControls } from "@/features/timer/QuickAddControls";
import { cn } from "@/lib/cn";
import { sessionLabel } from "@/lib/time";
import type { SessionType } from "@/types/domain";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";

const MODES: SessionType[] = ["focus", "shortBreak", "longBreak"];

export function TimerPanel() {
  const { timer, dispatchTimer, tasks, activeTaskId, ready, settings } = useGuestApp();
  const { stageRef, isFullscreen, chromeVisible, toggleFullscreen } = useFullscreen();
  const { notify } = useToast();
  const activeTask = tasks.find((task) => task.id === activeTaskId);
  const primaryLabel =
    timer.status === "running" ? "Pause" : timer.status === "paused" ? "Resume" : "Start";

  const onFullscreen = () => {
    void toggleFullscreen().then((ok) => {
      if (!ok) {
        notify("Fullscreen isn't available in this browser.");
      }
    });
  };

  return (
    <Card className="px-6 py-8 sm:px-10">
      <div
        ref={stageRef}
        className={cn(
          "timer-stage flex flex-col items-center",
          isFullscreen && "h-screen min-h-screen w-screen justify-center px-6 py-8",
        )}
      >
        {!isFullscreen ? (
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
        ) : (
          <p
            className={cn(
              "mb-8 text-center text-sm text-muted transition-opacity duration-700",
              !chromeVisible && "opacity-0",
            )}
          >
            {sessionLabel(timer.sessionType)}
            {activeTask ? ` · ${activeTask.title}` : ""}
          </p>
        )}

        <ClockDisplay
          style={settings.timerStyle}
          remainingMs={timer.remainingMs}
          durationMs={timer.durationMs}
          status={timer.status}
          sessionType={timer.sessionType}
          ready={ready}
          size={isFullscreen ? "immersive" : "default"}
        />

        {!isFullscreen ? (
          <p className="mt-4 min-h-6 text-center text-sm text-muted">
            {activeTask ? `Working on ${activeTask.title}` : "No task selected"}
          </p>
        ) : null}

        <div
          className={cn(
            "timer-chrome mt-6 flex flex-col items-center gap-4 transition-opacity duration-700",
            isFullscreen && !chromeVisible && "pointer-events-none opacity-0",
          )}
        >
          <QuickAddControls />
          <div className="flex flex-wrap items-center justify-center gap-3">
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
            {!isFullscreen ? (
              <Button
                variant="ghost"
                onClick={() => dispatchTimer({ type: "SKIP" })}
                aria-label="Skip to next session"
              >
                <SkipForward className="h-4 w-4" aria-hidden="true" />
                Skip
              </Button>
            ) : null}
            <Button
              variant="ghost"
              onClick={onFullscreen}
              aria-pressed={isFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              )}
              {isFullscreen ? "Exit" : "Fullscreen"}
            </Button>
            {isFullscreen ? <SoundscapeControl placement="above" /> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
