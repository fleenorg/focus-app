export const APP = {
  name: "Lumen",
  tagline: "Calm focus for study and deep work",
  description:
    "A guest-first Pomodoro timer with tasks, focus music, and session statistics. Data stays in this browser until you choose otherwise.",
} as const;

export const DEFAULT_TIMER_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  soundEnabled: false,
  notificationsEnabled: false,
} as const;

export const TIMER_LIMITS = {
  focusMinutes: { min: 1, max: 90 },
  shortBreakMinutes: { min: 1, max: 30 },
  longBreakMinutes: { min: 1, max: 60 },
  longBreakInterval: { min: 2, max: 12 },
} as const;

export const STORAGE_KEYS = {
  guestId: "lumen.v1.guestId",
  settings: "lumen.v1.settings",
  timer: "lumen.v1.timer",
  tasks: "lumen.v1.tasks",
  sessions: "lumen.v1.sessions",
  music: "lumen.v1.music",
  ui: "lumen.v1.ui",
} as const;
