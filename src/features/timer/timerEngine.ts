import { DEFAULT_TIMER_SETTINGS, TIMER_LIMITS } from "@/config/app";
import { createId } from "@/lib/id";
import { isRecord, asBoolean, asFiniteNumber, asString } from "@/lib/storage";
import { clamp, durationMsFor, remainingFromDeadline } from "@/lib/time";
import type {
  SessionCompletedEvent,
  SessionType,
  TimerSettings,
  TimerState,
  TimerStatus,
} from "@/types/domain";

export type TimerAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET" }
  | { type: "SKIP" }
  | { type: "SET_SESSION"; sessionType: SessionType }
  | { type: "SYNC" }
  | { type: "APPLY_SETTINGS" };

export interface TimerReduceResult {
  state: TimerState;
  completed: SessionCompletedEvent | null;
}

const SESSION_TYPES: SessionType[] = ["focus", "shortBreak", "longBreak"];
const STATUSES: TimerStatus[] = ["idle", "running", "paused"];

export function parseTimerSettings(value: unknown): TimerSettings | null {
  if (!isRecord(value)) {
    return null;
  }
  const focusMinutes = asFiniteNumber(value.focusMinutes);
  const shortBreakMinutes = asFiniteNumber(value.shortBreakMinutes);
  const longBreakMinutes = asFiniteNumber(value.longBreakMinutes);
  const longBreakInterval = asFiniteNumber(value.longBreakInterval);
  if (
    focusMinutes === null ||
    shortBreakMinutes === null ||
    longBreakMinutes === null ||
    longBreakInterval === null
  ) {
    return null;
  }
  return {
    focusMinutes: clamp(
      Math.round(focusMinutes),
      TIMER_LIMITS.focusMinutes.min,
      TIMER_LIMITS.focusMinutes.max,
    ),
    shortBreakMinutes: clamp(
      Math.round(shortBreakMinutes),
      TIMER_LIMITS.shortBreakMinutes.min,
      TIMER_LIMITS.shortBreakMinutes.max,
    ),
    longBreakMinutes: clamp(
      Math.round(longBreakMinutes),
      TIMER_LIMITS.longBreakMinutes.min,
      TIMER_LIMITS.longBreakMinutes.max,
    ),
    longBreakInterval: clamp(
      Math.round(longBreakInterval),
      TIMER_LIMITS.longBreakInterval.min,
      TIMER_LIMITS.longBreakInterval.max,
    ),
    soundEnabled: asBoolean(
      value.soundEnabled,
      DEFAULT_TIMER_SETTINGS.soundEnabled,
    ),
    notificationsEnabled: asBoolean(
      value.notificationsEnabled,
      DEFAULT_TIMER_SETTINGS.notificationsEnabled,
    ),
    theme:
      value.theme === "light" || value.theme === "dark"
        ? value.theme
        : DEFAULT_TIMER_SETTINGS.theme,
    timerStyle:
      value.timerStyle === "flip" || value.timerStyle === "classic"
        ? value.timerStyle
        : DEFAULT_TIMER_SETTINGS.timerStyle,
  };
}

export function createInitialTimerState(settings: TimerSettings): TimerState {
  const durationMs = durationMsFor("focus", settings);
  return {
    status: "idle",
    sessionType: "focus",
    durationMs,
    remainingMs: durationMs,
    deadlineAt: null,
    runningSince: null,
    runId: null,
    startedAt: null,
    accumulatedMs: 0,
    cycleFocusCompleted: 0,
    lastCompletedRunId: null,
  };
}

function isSessionType(value: unknown): value is SessionType {
  return typeof value === "string" && SESSION_TYPES.includes(value as SessionType);
}

function isStatus(value: unknown): value is TimerStatus {
  return typeof value === "string" && STATUSES.includes(value as TimerStatus);
}

export function parseTimerState(
  value: unknown,
  settings: TimerSettings,
): TimerState | null {
  if (!isRecord(value)) {
    return null;
  }
  if (!isStatus(value.status) || !isSessionType(value.sessionType)) {
    return null;
  }
  const durationMs = asFiniteNumber(value.durationMs);
  const remainingMs = asFiniteNumber(value.remainingMs);
  const cycleFocusCompleted = asFiniteNumber(value.cycleFocusCompleted);
  const accumulatedMs = asFiniteNumber(value.accumulatedMs);
  if (
    durationMs === null ||
    remainingMs === null ||
    cycleFocusCompleted === null ||
    accumulatedMs === null
  ) {
    return null;
  }
  const fallbackDuration = durationMsFor(value.sessionType, settings);
  return {
    status: value.status,
    sessionType: value.sessionType,
    durationMs: durationMs > 0 ? durationMs : fallbackDuration,
    remainingMs: clamp(remainingMs, 0, durationMs > 0 ? durationMs : fallbackDuration),
    deadlineAt: asFiniteNumber(value.deadlineAt),
    runningSince: asFiniteNumber(value.runningSince),
    runId: asString(value.runId),
    startedAt: asFiniteNumber(value.startedAt),
    accumulatedMs: Math.max(0, accumulatedMs),
    cycleFocusCompleted: Math.max(0, Math.round(cycleFocusCompleted)),
    lastCompletedRunId: asString(value.lastCompletedRunId),
  };
}

function syncRunningState(state: TimerState, now: number): TimerState {
  if (state.status !== "running" || state.deadlineAt === null) {
    return state;
  }
  const remainingMs = Math.min(
    state.durationMs,
    remainingFromDeadline(state.deadlineAt, now),
  );
  return { ...state, remainingMs };
}

function completeIfNeeded(
  state: TimerState,
  now: number,
): TimerReduceResult {
  const synced = syncRunningState(state, now);
  if (synced.status !== "running" || synced.remainingMs > 0 || !synced.runId) {
    return { state: synced, completed: null };
  }
  if (synced.lastCompletedRunId === synced.runId) {
    return { state: synced, completed: null };
  }

  const startedAt = synced.startedAt ?? now;
  const runningSlice =
    synced.runningSince !== null ? Math.max(0, now - synced.runningSince) : 0;
  const actualDurationMs = Math.min(
    synced.durationMs,
    synced.accumulatedMs + runningSlice,
  );

  const completed: SessionCompletedEvent = {
    runId: synced.runId,
    sessionType: synced.sessionType,
    startedAt,
    completedAt: now,
    plannedDurationMs: synced.durationMs,
    actualDurationMs,
  };

  const nextCycle =
    synced.sessionType === "focus"
      ? synced.cycleFocusCompleted + 1
      : synced.cycleFocusCompleted;

  return {
    state: {
      ...synced,
      lastCompletedRunId: synced.runId,
      cycleFocusCompleted: nextCycle,
    },
    completed,
  };
}

export function nextSessionType(
  current: SessionType,
  cycleFocusCompleted: number,
  longBreakInterval: number,
): SessionType {
  if (current !== "focus") {
    return "focus";
  }
  if (
    cycleFocusCompleted > 0 &&
    cycleFocusCompleted % longBreakInterval === 0
  ) {
    return "longBreak";
  }
  return "shortBreak";
}

function idleForType(
  sessionType: SessionType,
  settings: TimerSettings,
  preserved: Pick<
    TimerState,
    "cycleFocusCompleted" | "lastCompletedRunId"
  >,
): TimerState {
  const durationMs = durationMsFor(sessionType, settings);
  return {
    status: "idle",
    sessionType,
    durationMs,
    remainingMs: durationMs,
    deadlineAt: null,
    runningSince: null,
    runId: null,
    startedAt: null,
    accumulatedMs: 0,
    cycleFocusCompleted: preserved.cycleFocusCompleted,
    lastCompletedRunId: preserved.lastCompletedRunId,
  };
}

function beginRun(state: TimerState, now: number): TimerState {
  const remainingMs = Math.max(0, state.remainingMs);
  return {
    ...state,
    status: "running",
    runId: state.runId ?? createId(),
    startedAt: state.startedAt ?? now,
    deadlineAt: now + remainingMs,
    runningSince: now,
    remainingMs,
  };
}

export function reduceTimer(
  state: TimerState,
  action: TimerAction,
  now: number,
  settings: TimerSettings,
): TimerReduceResult {
  switch (action.type) {
    case "SYNC": {
      const { state: synced, completed } = completeIfNeeded(state, now);
      if (!completed) {
        return { state: synced, completed: null };
      }
      const nextType = nextSessionType(
        completed.sessionType,
        synced.cycleFocusCompleted,
        settings.longBreakInterval,
      );
      return {
        state: idleForType(nextType, settings, synced),
        completed,
      };
    }
    case "START": {
      if (state.status === "running") {
        return { state, completed: null };
      }
      const afterSync = reduceTimer(state, { type: "SYNC" }, now, settings);
      if (afterSync.completed) {
        return afterSync;
      }
      const ready =
        afterSync.state.status === "paused"
          ? afterSync.state
          : afterSync.state.remainingMs <= 0
            ? idleForType(afterSync.state.sessionType, settings, afterSync.state)
            : afterSync.state;
      return { state: beginRun(ready, now), completed: null };
    }
    case "PAUSE": {
      if (state.status !== "running") {
        return { state, completed: null };
      }
      const { state: synced, completed } = reduceTimer(
        state,
        { type: "SYNC" },
        now,
        settings,
      );
      if (completed) {
        return { state: synced, completed };
      }
      const runningSlice =
        synced.runningSince !== null ? Math.max(0, now - synced.runningSince) : 0;
      return {
        state: {
          ...synced,
          status: "paused",
          remainingMs: synced.remainingMs,
          deadlineAt: null,
          runningSince: null,
          accumulatedMs: synced.accumulatedMs + runningSlice,
        },
        completed: null,
      };
    }
    case "RESUME": {
      if (state.status !== "paused") {
        return { state, completed: null };
      }
      return { state: beginRun(state, now), completed: null };
    }
    case "RESET": {
      return {
        state: idleForType(state.sessionType, settings, {
          cycleFocusCompleted: state.cycleFocusCompleted,
          lastCompletedRunId: state.lastCompletedRunId,
        }),
        completed: null,
      };
    }
    case "SKIP": {
      const nextType = nextSessionType(
        state.sessionType,
        state.cycleFocusCompleted,
        settings.longBreakInterval,
      );
      return {
        state: idleForType(nextType, settings, state),
        completed: null,
      };
    }
    case "SET_SESSION": {
      if (
        action.sessionType === state.sessionType &&
        state.status === "idle" &&
        state.remainingMs === state.durationMs
      ) {
        return { state, completed: null };
      }
      return {
        state: idleForType(action.sessionType, settings, state),
        completed: null,
      };
    }
    case "APPLY_SETTINGS": {
      if (state.status !== "idle") {
        return { state, completed: null };
      }
      const durationMs = durationMsFor(state.sessionType, settings);
      return {
        state: {
          ...state,
          durationMs,
          remainingMs: durationMs,
        },
        completed: null,
      };
    }
  }
}
