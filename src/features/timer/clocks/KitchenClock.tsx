"use client";

import { cn } from "@/lib/cn";
import { formatCountdown, sessionLabel } from "@/lib/time";
import type { ClockFaceProps } from "./types";

function statusLabel(status: ClockFaceProps["status"]) {
  if (status === "running") {
    return "In progress";
  }
  if (status === "paused") {
    return "Paused";
  }
  return "Ready";
}

export function KitchenClock({
  remainingMs,
  durationMs,
  status,
  sessionType,
  ready,
  size,
}: ClockFaceProps) {
  const ratio =
    !ready || durationMs <= 0 ? 0 : Math.min(1, Math.max(0, remainingMs / durationMs));
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * ratio;
  const degrees = ratio * 360;
  const text = ready ? formatCountdown(remainingMs) : "--:--";
  const immersive = size === "immersive";
  const ticks = Array.from({ length: 60 }, (_, index) => {
    const major = index % 5 === 0;
    const angle = (index / 60) * Math.PI * 2 - Math.PI / 2;
    const inner = major ? 84 : 92;
    const outer = 100;
    return {
      index,
      major,
      x1: 120 + Math.cos(angle) * inner,
      y1: 120 + Math.sin(angle) * inner,
      x2: 120 + Math.cos(angle) * outer,
      y2: 120 + Math.sin(angle) * outer,
    };
  });

  return (
    <div className={cn("flex flex-col items-center", immersive ? "gap-8" : "gap-5")}>
      <p className="text-xs uppercase tracking-[0.22em] text-muted">
        {sessionLabel(sessionType)}
      </p>
      <div
        className={cn(
          "relative",
          immersive ? "h-[min(72vmin,36rem)] w-[min(72vmin,36rem)]" : "h-64 w-64 sm:h-72 sm:w-72",
        )}
        role="img"
        aria-label={`${sessionLabel(sessionType)} remaining ${ready ? text : "not ready"}`}
      >
        <svg className="h-full w-full" viewBox="0 0 240 240" aria-hidden="true">
          <defs>
            <radialGradient id="kitchen-face" cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor="#fffaf0" />
              <stop offset="70%" stopColor="#f3ead7" />
              <stop offset="100%" stopColor="#e4d3b4" />
            </radialGradient>
          </defs>
          <circle cx="120" cy="120" r="116" className="fill-surface" />
          <circle cx="120" cy="120" r="112" fill="#8d7350" />
          <circle cx="120" cy="120" r="104" fill="url(#kitchen-face)" />
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="#d9c7a6"
            strokeWidth="10"
          />
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="#b94a3a"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90 120 120)"
          />
          {ticks.map((tick) => (
            <line
              key={tick.index}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="#3a2e22"
              strokeWidth={tick.major ? 2.4 : 1}
              strokeLinecap="round"
            />
          ))}
          <g transform={`rotate(${degrees} 120 120)`}>
            <line
              x1="120"
              y1="128"
              x2="120"
              y2="48"
              stroke="#2b2118"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="120" cy="48" r="4" fill="#b94a3a" />
          </g>
          <circle cx="120" cy="120" r="7" fill="#2b2118" />
          <circle cx="120" cy="120" r="3" fill="#f4efe4" />
          <circle cx="120" cy="18" r="7" fill="#c4a574" stroke="#6d5436" strokeWidth="2" />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[26%]">
          <p
            className={cn(
              "rounded-full bg-[#f7f1e4]/90 px-3 py-1 font-mono font-medium tracking-tight text-[#2b2118]",
              immersive ? "text-2xl" : "text-lg",
            )}
          >
            {text}
          </p>
        </div>
      </div>
      <p className="text-sm text-muted">{statusLabel(status)}</p>
    </div>
  );
}
