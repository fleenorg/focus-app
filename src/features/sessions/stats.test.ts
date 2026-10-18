import { describe, expect, it } from "vitest";
import type { FocusSessionRecord } from "@/types/domain";
import { buildStats, parseSessionList } from "./stats";

function session(
  id: string,
  completedAt: number,
  actualDurationMs: number,
): FocusSessionRecord {
  return {
    id,
    startedAt: completedAt - actualDurationMs,
    completedAt,
    plannedDurationMs: 25 * 60_000,
    actualDurationMs,
    taskId: null,
    taskTitle: null,
    status: "completed",
  };
}

describe("session stats", () => {
  it("counts only completed sessions and uses actual duration", () => {
    const now = new Date(2026, 9, 18, 15, 0, 0).getTime();
    const todayMorning = new Date(2026, 9, 18, 9, 0, 0).getTime();
    const yesterday = new Date(2026, 9, 17, 9, 0, 0).getTime();
    const records = [
      session("a", todayMorning, 24 * 60_000),
      session("b", todayMorning + 3_600_000, 25 * 60_000),
      session("c", yesterday, 25 * 60_000),
    ];
    const stats = buildStats(records, now);
    expect(stats.today.completedCount).toBe(2);
    expect(stats.today.actualFocusMs).toBe(49 * 60_000);
    expect(stats.allTimeCount).toBe(3);
    expect(stats.week).toHaveLength(7);
    expect(stats.week.at(-1)?.completedCount).toBe(2);
  });

  it("rejects malformed history", () => {
    expect(parseSessionList([{ id: "x" }])).toBeNull();
    expect(parseSessionList("nope")).toBeNull();
  });
});
