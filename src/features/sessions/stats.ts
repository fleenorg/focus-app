import { asFiniteNumber, asString, isRecord } from "@/lib/storage";
import { addLocalDays, localDateKey, startOfLocalDay } from "@/lib/time";
import type { FocusSessionRecord } from "@/types/domain";

export function parseSessionRecord(value: unknown): FocusSessionRecord | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = asString(value.id);
  const startedAt = asFiniteNumber(value.startedAt);
  const completedAt = asFiniteNumber(value.completedAt);
  const plannedDurationMs = asFiniteNumber(value.plannedDurationMs);
  const actualDurationMs = asFiniteNumber(value.actualDurationMs);
  if (
    !id ||
    startedAt === null ||
    completedAt === null ||
    plannedDurationMs === null ||
    actualDurationMs === null
  ) {
    return null;
  }
  if (value.status !== "completed") {
    return null;
  }
  return {
    id,
    startedAt,
    completedAt,
    plannedDurationMs,
    actualDurationMs,
    taskId: asString(value.taskId),
    taskTitle: asString(value.taskTitle),
    status: "completed",
  };
}

export function parseSessionList(value: unknown): FocusSessionRecord[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const records: FocusSessionRecord[] = [];
  for (const item of value) {
    const record = parseSessionRecord(item);
    if (!record) {
      return null;
    }
    records.push(record);
  }
  return records;
}

export interface DailySummary {
  dateKey: string;
  completedCount: number;
  actualFocusMs: number;
}

export interface WeekDayPoint {
  dateKey: string;
  label: string;
  actualFocusMs: number;
  completedCount: number;
}

export interface StatsSnapshot {
  today: DailySummary;
  recent: FocusSessionRecord[];
  week: WeekDayPoint[];
  allTimeCount: number;
  allTimeFocusMs: number;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function buildStats(
  sessions: FocusSessionRecord[],
  now: number,
): StatsSnapshot {
  const todayKey = localDateKey(now);
  const todayStart = startOfLocalDay(now);
  const weekStart = addLocalDays(todayStart, -6);

  const todaySessions = sessions.filter(
    (session) => localDateKey(session.completedAt) === todayKey,
  );

  const week: WeekDayPoint[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const dayTs = addLocalDays(weekStart, offset);
    const dateKey = localDateKey(dayTs);
    const daySessions = sessions.filter(
      (session) => localDateKey(session.completedAt) === dateKey,
    );
    week.push({
      dateKey,
      label: WEEKDAY_LABELS[new Date(dayTs).getDay()] ?? "",
      actualFocusMs: daySessions.reduce(
        (sum, session) => sum + session.actualDurationMs,
        0,
      ),
      completedCount: daySessions.length,
    });
  }

  const recent = [...sessions].sort((a, b) => b.completedAt - a.completedAt).slice(0, 8);

  return {
    today: {
      dateKey: todayKey,
      completedCount: todaySessions.length,
      actualFocusMs: todaySessions.reduce(
        (sum, session) => sum + session.actualDurationMs,
        0,
      ),
    },
    recent,
    week,
    allTimeCount: sessions.length,
    allTimeFocusMs: sessions.reduce(
      (sum, session) => sum + session.actualDurationMs,
      0,
    ),
  };
}
