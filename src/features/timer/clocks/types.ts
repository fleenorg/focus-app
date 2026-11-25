import type { SessionType, TimerStatus } from "@/types/domain";

export interface ClockFaceProps {
  remainingMs: number;
  durationMs: number;
  status: TimerStatus;
  sessionType: SessionType;
  ready: boolean;
  size: "default" | "immersive";
}
