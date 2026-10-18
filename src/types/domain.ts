export type SessionType = "focus" | "shortBreak" | "longBreak";
export type TimerStatus = "idle" | "running" | "paused";

export interface TimerSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface TimerState {
  status: TimerStatus;
  sessionType: SessionType;
  durationMs: number;
  remainingMs: number;
  deadlineAt: number | null;
  runningSince: number | null;
  runId: string | null;
  startedAt: number | null;
  accumulatedMs: number;
  cycleFocusCompleted: number;
  lastCompletedRunId: string | null;
}

export interface SessionCompletedEvent {
  runId: string;
  sessionType: SessionType;
  startedAt: number;
  completedAt: number;
  plannedDurationMs: number;
  actualDurationMs: number;
}

export interface FocusSessionRecord {
  id: string;
  startedAt: number;
  completedAt: number;
  plannedDurationMs: number;
  actualDurationMs: number;
  taskId: string | null;
  taskTitle: string | null;
  status: "completed";
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  /** Reserved for future account-backed ownership. Null means local guest. */
  ownerId: string | null;
}

export interface MusicPrefs {
  lastUrl: string;
  collapsed: boolean;
}

export interface UiPrefs {
  musicCollapsed: boolean;
}

export type ParsedYouTube =
  | { kind: "video"; videoId: string }
  | { kind: "playlist"; playlistId: string };

export interface YoutubeParseError {
  message: string;
}
