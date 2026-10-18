"use client";

import { Card } from "@/components/ui/card";
import { useAppStats } from "@/features/app/GuestAppProvider";
import { formatDurationMinutes } from "@/lib/time";

export function StatsView() {
  const stats = useAppStats();
  const maxWeekMs = Math.max(...stats.week.map((day) => day.actualFocusMs), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          These numbers come from completed focus sessions only. Paused, skipped, or
          interrupted sessions are not counted. Focus time is actual elapsed running
          time, not just the duration you configured.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sessions today" value={String(stats.today.completedCount)} />
        <StatCard
          label="Focus today"
          value={formatDurationMinutes(stats.today.actualFocusMs)}
        />
        <StatCard
          label="All-time focus"
          value={`${stats.allTimeCount} · ${formatDurationMinutes(stats.allTimeFocusMs)}`}
        />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Last 7 days</h2>
        <div className="mt-6 flex h-40 items-end gap-3">
          {stats.week.map((day) => {
            const height = Math.max(6, (day.actualFocusMs / maxWeekMs) * 100);
            return (
              <div key={day.dateKey} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end rounded-lg bg-background">
                  <div
                    className="w-full rounded-lg bg-accent/80"
                    style={{ height: `${height}%` }}
                    title={`${day.label}: ${day.completedCount} sessions, ${formatDurationMinutes(day.actualFocusMs)}`}
                    aria-label={`${day.label}: ${day.completedCount} sessions, ${formatDurationMinutes(day.actualFocusMs)}`}
                  />
                </div>
                <span className="text-xs text-muted">{day.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Recent sessions</h2>
        {stats.recent.length === 0 ? (
          <p className="mt-4 text-sm leading-6 text-muted">
            Complete a focus session to see your history here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {stats.recent.map((session) => (
              <li key={session.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="text-foreground">
                    {session.taskTitle ?? "No task selected"}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(session.completedAt).toLocaleString()}
                  </p>
                </div>
                <p className="font-mono text-muted">
                  {formatDurationMinutes(session.actualDurationMs)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl text-foreground">{value}</p>
    </Card>
  );
}
