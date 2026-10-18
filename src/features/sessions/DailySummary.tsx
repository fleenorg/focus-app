"use client";

import { Card } from "@/components/ui/card";
import { useAppStats, useGuestApp } from "@/features/app/GuestAppProvider";
import { formatDurationMinutes } from "@/lib/time";

export function DailySummary() {
  const stats = useAppStats();
  const { timer, settings } = useGuestApp();
  const interval = settings.longBreakInterval;
  const cycleStep =
    timer.cycleFocusCompleted === 0
      ? 0
      : timer.cycleFocusCompleted % interval === 0
        ? interval
        : timer.cycleFocusCompleted % interval;

  return (
    <Card className="grid grid-cols-3 divide-x divide-border">
      <SummaryStat
        label="Today"
        value={String(stats.today.completedCount)}
        hint="completed focus sessions"
      />
      <SummaryStat
        label="Focus time"
        value={formatDurationMinutes(stats.today.actualFocusMs)}
        hint="actual time focused today"
      />
      <SummaryStat
        label="Cycle"
        value={`${cycleStep}/${interval}`}
        hint="focus sessions toward a long break"
      />
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="px-4 py-5 text-center sm:px-6">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
