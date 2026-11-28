"use client";

import { DEFAULT_TIMER_SETTINGS, STORAGE_KEYS } from "@/config/app";
import { useToast } from "@/components/ui/toast";
import { playCompletionChime } from "@/features/timer/chime";
import {
  createInitialTimerState,
  parseTimerSettings,
  parseTimerState,
  reduceTimer,
  type TimerAction,
} from "@/features/timer/timerEngine";
import { buildStats } from "@/features/sessions/stats";
import { parseSessionList } from "@/features/sessions/stats";
import {
  createTask,
  parseTaskList,
  removeTask,
  sortTasks,
  toggleTask,
  updateTaskTitle,
} from "@/features/tasks/tasks";
import { createId } from "@/lib/id";
import { asBoolean, asString, isRecord, readJson, removeItem, writeJson } from "@/lib/storage";
import { sessionLabel } from "@/lib/time";
import type {
  FocusSessionRecord,
  SessionCompletedEvent,
  Task,
  TimerSettings,
  TimerState,
} from "@/types/domain";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";

interface GuestAppValue {
  ready: boolean;
  guestId: string;
  settings: TimerSettings;
  timer: TimerState;
  tasks: Task[];
  activeTaskId: string | null;
  sessions: FocusSessionRecord[];
  lastCompletedAt: number | null;
  musicUrl: string;
  musicCollapsed: boolean;
  dispatchTimer: (action: TimerAction) => void;
  updateSettings: (settings: TimerSettings) => void;
  addTask: (title: string) => void;
  editTask: (id: string, title: string) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  restoreTask: (task: Task, wasActive: boolean) => void;
  selectTask: (id: string | null) => void;
  setMusicUrl: (url: string) => void;
  setMusicCollapsed: (collapsed: boolean) => void;
  resetLocalData: () => void;
}

const GuestAppContext = createContext<GuestAppValue | null>(null);

function parseMusicState(value: unknown): { lastUrl: string; collapsed: boolean } | null {
  if (!isRecord(value)) {
    return null;
  }
  const lastUrl = asString(value.lastUrl);
  if (lastUrl === null) {
    return null;
  }
  return {
    lastUrl,
    collapsed: asBoolean(value.collapsed, false),
  };
}

function activeTaskIdFrom(value: unknown, tasks: Task[]): string | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = asString(value.activeTaskId);
  if (!id || !tasks.some((task) => task.id === id)) {
    return null;
  }
  return id;
}

export function GuestAppProvider({ children }: { children: React.ReactNode }) {
  const { notify } = useToast();
  const [ready, setReady] = useState(false);
  const [guestId, setGuestId] = useState("guest");
  const [settings, setSettings] = useState<TimerSettings>({ ...DEFAULT_TIMER_SETTINGS });
  const [timer, setTimer] = useState<TimerState>(() =>
    createInitialTimerState({ ...DEFAULT_TIMER_SETTINGS }),
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<FocusSessionRecord[]>([]);
  const [lastCompletedAt, setLastCompletedAt] = useState<number | null>(null);
  const [musicUrl, setMusicUrlState] = useState("");
  const [musicCollapsed, setMusicCollapsedState] = useState(false);
  const timerRef = useRef(timer);
  const settingsRef = useRef(settings);
  const tasksRef = useRef(tasks);
  const activeTaskIdRef = useRef(activeTaskId);

useLayoutEffect(() => {
  timerRef.current = timer;
  settingsRef.current = settings;
  tasksRef.current = tasks;
  activeTaskIdRef.current = activeTaskId;
}, [timer, settings, tasks, activeTaskId]);

  const recordCompletion = useCallback(
    (event: SessionCompletedEvent) => {
      setLastCompletedAt(event.completedAt);
      if (event.sessionType !== "focus") {
        notify(`${sessionLabel(event.sessionType)} complete`);
        return;
      }
      const currentTasks = tasksRef.current;
      const currentActive = activeTaskIdRef.current;
      const activeTask = currentTasks.find((task) => task.id === currentActive) ?? null;
      const record: FocusSessionRecord = {
        id: event.runId,
        startedAt: event.startedAt,
        completedAt: event.completedAt,
        plannedDurationMs: event.plannedDurationMs,
        actualDurationMs: event.actualDurationMs,
        taskId: activeTask?.id ?? null,
        taskTitle: activeTask?.title ?? null,
        status: "completed",
      };
      setSessions((current) => [record, ...current]);
      notify("Focus session complete");
    },
    [notify],
  );

  const applyTimerResult = useCallback(
    (action: TimerAction, now = Date.now()) => {
      const result = reduceTimer(
        timerRef.current,
        action,
        now,
        settingsRef.current,
      );
      timerRef.current = result.state;
      setTimer(result.state);
      if (result.completed) {
        recordCompletion(result.completed);
        const currentSettings = settingsRef.current;
        if (currentSettings.soundEnabled) {
          playCompletionChime();
        }
        if (
          currentSettings.notificationsEnabled &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          const title =
            result.completed.sessionType === "focus"
              ? "Focus session complete"
              : `${sessionLabel(result.completed.sessionType)} complete`;
          try {
            new Notification(title, {
              body: "Lumen is ready for the next session.",
            });
          } catch {
            // Some browsers require a service worker for notifications.
          }
        }
      }
    },
    [recordCompletion],
  );

  const dispatchTimer = useCallback(
    (action: TimerAction) => {
      applyTimerResult(action);
    },
    [applyTimerResult],
  );
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {

    const storedSettings =
      readJson(STORAGE_KEYS.settings, parseTimerSettings) ?? {
        ...DEFAULT_TIMER_SETTINGS,
      };
    const storedTimer = readJson(STORAGE_KEYS.timer, (value) =>
      parseTimerState(value, storedSettings),
    );
    const storedTasks = readJson(STORAGE_KEYS.tasks, parseTaskList) ?? [];
    const storedSessions = readJson(STORAGE_KEYS.sessions, parseSessionList) ?? [];
    const storedMusic = readJson(STORAGE_KEYS.music, parseMusicState);
    const storedGuest = readJson(STORAGE_KEYS.guestId, (value) => asString(value));
    const storedUi = readJson(STORAGE_KEYS.ui, (value) =>
      isRecord(value) ? value : null,
    );

    const nextGuestId = storedGuest ?? createId();
    setGuestId(nextGuestId);
    setSettings(storedSettings);
    settingsRef.current = storedSettings;
    setTasks(storedTasks);
    setSessions(storedSessions);
    setMusicUrlState(storedMusic?.lastUrl ?? "");
    setMusicCollapsedState(storedMusic?.collapsed ?? false);
    setActiveTaskId(activeTaskIdFrom(storedUi, storedTasks));

    const initialTimer = storedTimer ?? createInitialTimerState(storedSettings);
    const synced = reduceTimer(initialTimer, { type: "SYNC" }, Date.now(), storedSettings);
    timerRef.current = synced.state;
    setTimer(synced.state);
    if (synced.completed) {
      recordCompletion(synced.completed);
    }
    setReady(true);
  }, [recordCompletion]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) {
      return;
    }
    writeJson(STORAGE_KEYS.guestId, guestId);
    writeJson(STORAGE_KEYS.settings, settings);
    writeJson(STORAGE_KEYS.tasks, tasks);
    writeJson(STORAGE_KEYS.sessions, sessions);
    writeJson(STORAGE_KEYS.music, { lastUrl: musicUrl, collapsed: musicCollapsed });
    writeJson(STORAGE_KEYS.ui, { activeTaskId });

    
  }, [
    ready,
    guestId,
    settings,
    tasks,
    sessions,
    musicUrl,
    musicCollapsed,
    activeTaskId,
  ]);

  useEffect(() => {
  document.documentElement.dataset.theme = settings.theme;
}, [settings.theme]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    writeJson(STORAGE_KEYS.timer, timerRef.current);
  }, [
    ready,
    timer.status,
    timer.sessionType,
    timer.deadlineAt,
    timer.runId,
    timer.cycleFocusCompleted,
    timer.lastCompletedRunId,
    timer.accumulatedMs,
  ]);

  useEffect(() => {
    if (!ready || timer.status !== "running") {
      return;
    }
    const interval = window.setInterval(() => {
      applyTimerResult({ type: "SYNC" });
    }, 250);
    const onResume = () => applyTimerResult({ type: "SYNC" });
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
    };
  }, [applyTimerResult, ready, timer.status]);

  const updateSettings = useCallback((next: TimerSettings) => {
    const parsed = parseTimerSettings(next) ?? next;
    setSettings(parsed);
    settingsRef.current = parsed;
    const result = reduceTimer(
      timerRef.current,
      { type: "APPLY_SETTINGS" },
      Date.now(),
      parsed,
    );
    timerRef.current = result.state;
    setTimer(result.state);
  }, []);

  const addTask = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) {
        return;
      }
      setTasks((current) => [createTask(trimmed, guestId, Date.now()), ...current]);
    },
    [guestId],
  );

  const editTask = useCallback((id: string, title: string) => {
    setTasks((current) => updateTaskTitle(current, id, title, Date.now()));
  }, []);

  const completeTask = useCallback((id: string) => {
    setTasks((current) => toggleTask(current, id, Date.now()));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((current) => removeTask(current, id));
    setActiveTaskId((current) => (current === id ? null : current));
  }, []);

  const restoreTask = useCallback((task: Task, wasActive: boolean) => {
    setTasks((current) =>
      current.some((item) => item.id === task.id) ? current : [task, ...current],
    );
    if (wasActive) {
      setActiveTaskId(task.id);
    }
  }, []);

  const selectTask = useCallback((id: string | null) => {
    setActiveTaskId(id);
  }, []);

  const setMusicUrl = useCallback((url: string) => {
    setMusicUrlState(url);
  }, []);

  const setMusicCollapsed = useCallback((collapsed: boolean) => {
    setMusicCollapsedState(collapsed);
  }, []);

  const resetLocalData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => removeItem(key));
    const nextSettings = { ...DEFAULT_TIMER_SETTINGS };
    const nextGuest = createId();
    const nextTimer = createInitialTimerState(nextSettings);
    setGuestId(nextGuest);
    setSettings(nextSettings);
    settingsRef.current = nextSettings;
    setTimer(nextTimer);
    timerRef.current = nextTimer;
    setTasks([]);
    setActiveTaskId(null);
    setSessions([]);
    setLastCompletedAt(null);
    setMusicUrlState("");
    setMusicCollapsedState(false);
    notify("Local data has been cleared");
  }, [notify]);

  const value = useMemo<GuestAppValue>(
    () => ({
      ready,
      guestId,
      settings,
      timer,
      tasks: sortTasks(tasks),
      activeTaskId,
      sessions,
      lastCompletedAt,
      musicUrl,
      musicCollapsed,
      dispatchTimer,
      updateSettings,
      addTask,
      editTask,
      completeTask,
      deleteTask,
      restoreTask,
      selectTask,
      setMusicUrl,
      setMusicCollapsed,
      resetLocalData,
    }),
    [
      ready,
      guestId,
      settings,
      timer,
      tasks,
      activeTaskId,
      sessions,
      lastCompletedAt,
      musicUrl,
      musicCollapsed,
      dispatchTimer,
      updateSettings,
      addTask,
      editTask,
      completeTask,
      deleteTask,
      restoreTask,
      selectTask,
      setMusicUrl,
      setMusicCollapsed,
      resetLocalData,
    ],
  );

  return (
    <GuestAppContext.Provider value={value}>{children}</GuestAppContext.Provider>
  );
}

export function useGuestApp(): GuestAppValue {
  const value = useContext(GuestAppContext);
  if (!value) {
    throw new Error("useGuestApp must be used within GuestAppProvider");
  }
  return value;
}

export function useAppStats() {
  const { sessions } = useGuestApp();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => buildStats(sessions, now), [sessions, now]);
}
