import { describe, expect, it } from "vitest";
import { DEFAULT_TIMER_SETTINGS } from "@/config/app";
import type { TimerSettings, TimerState } from "@/types/domain";
import {
  createInitialTimerState,
  nextSessionType,
  parseTimerSettings,
  parseTimerState,
  reduceTimer,
} from "./timerEngine";

const settings: TimerSettings = { ...DEFAULT_TIMER_SETTINGS };
const NOW = 1_700_000_000_000;

function elapsed(state: TimerState, ms: number): TimerState {
  return reduceTimer(state, { type: "SYNC" }, NOW + ms, settings).state;
}

describe("timer engine", () => {
  it("derives remaining time from a deadline instead of subtracting ticks", () => {
    const idle = createInitialTimerState(settings);
    const started = reduceTimer(idle, { type: "START" }, NOW, settings).state;
    expect(started.deadlineAt).toBe(NOW + idle.durationMs);

    const later = reduceTimer(started, { type: "SYNC" }, NOW + 12_500, settings)
      .state;
    expect(later.remainingMs).toBe(idle.durationMs - 12_500);
  });

  it("pauses and resumes without losing remaining time", () => {
    const started = reduceTimer(
      createInitialTimerState(settings),
      { type: "START" },
      NOW,
      settings,
    ).state;
    const paused = reduceTimer(
      started,
      { type: "PAUSE" },
      NOW + 40_000,
      settings,
    ).state;
    expect(paused.status).toBe("paused");
    expect(paused.remainingMs).toBe(started.durationMs - 40_000);

    const resumed = reduceTimer(paused, { type: "RESUME" }, NOW + 90_000, settings)
      .state;
    expect(resumed.status).toBe("running");
    expect(resumed.deadlineAt).toBe(NOW + 90_000 + paused.remainingMs);

    const after = reduceTimer(
      resumed,
      { type: "SYNC" },
      NOW + 90_000 + 5_000,
      settings,
    ).state;
    expect(after.remainingMs).toBe(paused.remainingMs - 5_000);
  });

  it("reset restores the current session duration and does not complete", () => {
    const started = reduceTimer(
      createInitialTimerState(settings),
      { type: "START" },
      NOW,
      settings,
    ).state;
    const result = reduceTimer(started, { type: "RESET" }, NOW + 8_000, settings);
    expect(result.completed).toBeNull();
    expect(result.state.status).toBe("idle");
    expect(result.state.remainingMs).toBe(result.state.durationMs);
    expect(result.state.sessionType).toBe("focus");
  });

  it("skip advances without recording a completed session", () => {
    const started = reduceTimer(
      createInitialTimerState(settings),
      { type: "START" },
      NOW,
      settings,
    ).state;
    const skipped = reduceTimer(started, { type: "SKIP" }, NOW + 3_000, settings);
    expect(skipped.completed).toBeNull();
    expect(skipped.state.sessionType).toBe("shortBreak");
    expect(skipped.state.status).toBe("idle");
  });

  it("records a focus completion exactly once even if synced twice at zero", () => {
    const idle = createInitialTimerState(settings);
    const started = reduceTimer(idle, { type: "START" }, NOW, settings).state;
    const first = reduceTimer(
      started,
      { type: "SYNC" },
      NOW + idle.durationMs,
      settings,
    );
    expect(first.completed?.sessionType).toBe("focus");
    expect(first.completed?.runId).toBeTruthy();
    expect(first.state.sessionType).toBe("shortBreak");

    const second = reduceTimer(
      first.state,
      { type: "SYNC" },
      NOW + idle.durationMs + 1_000,
      settings,
    );
    expect(second.completed).toBeNull();
  });

  it("does not treat pause as completion", () => {
    const started = reduceTimer(
      createInitialTimerState(settings),
      { type: "START" },
      NOW,
      settings,
    ).state;
    const paused = reduceTimer(started, { type: "PAUSE" }, NOW + 1_000, settings);
    expect(paused.completed).toBeNull();
    expect(paused.state.status).toBe("paused");
  });

  it("moves to a long break after every four completed focus sessions", () => {
    expect(nextSessionType("focus", 1, 4)).toBe("shortBreak");
    expect(nextSessionType("focus", 4, 4)).toBe("longBreak");
    expect(nextSessionType("focus", 8, 4)).toBe("longBreak");
    expect(nextSessionType("shortBreak", 4, 4)).toBe("focus");
  });

  it("completes into a long break on the fourth focus", () => {
    let state = createInitialTimerState(settings);
    state = { ...state, cycleFocusCompleted: 3 };
    const started = reduceTimer(state, { type: "START" }, NOW, settings).state;
    const done = reduceTimer(
      started,
      { type: "SYNC" },
      NOW + started.durationMs,
      settings,
    );
    expect(done.completed?.sessionType).toBe("focus");
    expect(done.state.sessionType).toBe("longBreak");
    expect(done.state.cycleFocusCompleted).toBe(4);
  });

  it("switching session type does not count the current run", () => {
    const started = reduceTimer(
      createInitialTimerState(settings),
      { type: "START" },
      NOW,
      settings,
    ).state;
    const switched = reduceTimer(
      started,
      { type: "SET_SESSION", sessionType: "shortBreak" },
      NOW + 2_000,
      settings,
    );
    expect(switched.completed).toBeNull();
    expect(switched.state.sessionType).toBe("shortBreak");
    expect(switched.state.status).toBe("idle");
  });

  it("clamps remaining time if the clock jumps backward", () => {
    const started = reduceTimer(
      createInitialTimerState(settings),
      { type: "START" },
      NOW,
      settings,
    ).state;
    const jumped = elapsed(started, -60_000);
    expect(jumped.remainingMs).toBeLessThanOrEqual(started.durationMs);
  });

  it("parses settings with clamps and rejects malformed objects", () => {
    expect(parseTimerSettings(null)).toBeNull();
    expect(parseTimerSettings({ focusMinutes: 25 })).toBeNull();
    const parsed = parseTimerSettings({
      focusMinutes: 200,
      shortBreakMinutes: 0,
      longBreakMinutes: 15,
      longBreakInterval: 4,
      soundEnabled: true,
    });
    expect(parsed?.focusMinutes).toBe(90);
    expect(parsed?.shortBreakMinutes).toBe(1);
    expect(parsed?.soundEnabled).toBe(true);
  });

  it("recovers persisted running state and completes a finished deadline once", () => {
    const idle = createInitialTimerState(settings);
    const started = reduceTimer(idle, { type: "START" }, NOW, settings).state;
    const persisted = parseTimerState(started, settings);
    expect(persisted?.runId).toBe(started.runId);

    const recovered = reduceTimer(
      persisted!,
      { type: "SYNC" },
      NOW + idle.durationMs + 5_000,
      settings,
    );
    expect(recovered.completed?.runId).toBe(started.runId);

    const again = reduceTimer(
      recovered.state,
      { type: "SYNC" },
      NOW + idle.durationMs + 10_000,
      settings,
    );
    expect(again.completed).toBeNull();
  });

  it("ignores malformed persisted timer snapshots", () => {
    expect(parseTimerState({ status: "running" }, settings)).toBeNull();
    expect(parseTimerState("nope", settings)).toBeNull();
  });
});
