"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { QUICK_ADD_MINUTES } from "@/config/app";
import { useGuestApp } from "@/features/app/GuestAppProvider";

export function QuickAddControls() {
  const { timer, settings, dispatchTimer } = useGuestApp();
  const { notify } = useToast();
  const thresholdMs = settings.quickAddThresholdMinutes * 60_000;
  const visible =
    timer.remainingMs > 0 &&
    timer.remainingMs < timer.durationMs &&
    timer.remainingMs <= thresholdMs;

  if (!visible) {
    return null;
  }

  return (
    <div className="quick-add flex items-center justify-center gap-2" aria-label="Add time">
      {QUICK_ADD_MINUTES.map((minutes) => (
        <Button
          key={minutes}
          size="sm"
          variant="secondary"
          onClick={() => {
            dispatchTimer({ type: "ADD_TIME", minutes });
            notify(`+${minutes}:00 added`);
          }}
        >
          +{minutes} min
        </Button>
      ))}
    </div>
  );
}
