import type { SessionType, TimerSettings } from "@/types/domain";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function minutesToMs(minutes: number): number {
  return minutes * 60_000;
}

export function durationMsFor(
  sessionType: SessionType,
  settings: TimerSettings,
): number {
  switch (sessionType) {
    case "focus":
      return minutesToMs(settings.focusMinutes);
    case "shortBreak":
      return minutesToMs(settings.shortBreakMinutes);
    case "longBreak":
      return minutesToMs(settings.longBreakMinutes);
  }
}

export function remainingFromDeadline(deadlineAt: number, now: number): number {
  return Math.max(0, deadlineAt - now);
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function formatDurationMinutes(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) {
    const seconds = Math.max(1, Math.round(ms / 1000));
    return `${seconds}s`;
  }
  return `${minutes}m`;
}

export function localDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfLocalDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function addLocalDays(timestamp: number, days: number): number {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

export function sessionLabel(sessionType: SessionType): string {
  switch (sessionType) {
    case "focus":
      return "Focus";
    case "shortBreak":
      return "Short Break";
    case "longBreak":
      return "Long Break";
  }
}
