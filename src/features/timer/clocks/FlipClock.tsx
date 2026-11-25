"use client";

import { cn } from "@/lib/cn";
import { formatCountdown, sessionLabel } from "@/lib/time";
import { useSyncExternalStore } from "react";
import type { ClockFaceProps } from "./types";
import { useState } from "react";

function subscribeReducedMotion(onStoreChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function FlipDigit({ value }: { value: string }) {
  const reduceMotion = useReducedMotion();
  const [settled, setSettled] = useState(value);
  const [motion, setMotion] = useState<{ from: string; to: string } | null>(null);

  if (value !== settled) {
    if (reduceMotion) {
      setSettled(value);
      if (motion) {
        setMotion(null);
      }
    } else if (!motion || motion.to !== value) {
      setMotion({ from: motion?.from ?? settled, to: value });
    }
  }

  const top = motion ? motion.to : settled;
  const bottom = motion ? motion.from : settled;

  return (
    <span className="flip-digit" aria-hidden="true">
      <span className="flip-half flip-top">
        <span>{top}</span>
      </span>
      <span className="flip-half flip-bottom">
        <span>{bottom}</span>
      </span>
      {motion ? (
        <>
          <span className="flip-leaf flip-leaf-front">
            <span>{motion.from}</span>
          </span>
          <span
            className="flip-leaf flip-leaf-back"
            onAnimationEnd={(event) => {
              if (event.animationName !== "flip-back") {
                return;
              }
              setSettled(motion.to);
              setMotion(null);
            }}
          >
            <span>{motion.to}</span>
          </span>
        </>
      ) : null}
      <span className="flip-seam" />
    </span>
  );
}

function statusLabel(status: ClockFaceProps["status"]) {
  if (status === "running") {
    return "In progress";
  }
  if (status === "paused") {
    return "Paused";
  }
  return "Ready";
}

export function FlipClock({
  remainingMs,
  status,
  sessionType,
  ready,
  size,
}: ClockFaceProps) {
  const text = ready ? formatCountdown(remainingMs) : "--:--";
  const immersive = size === "immersive";

  return (
    <div
      className={cn("flex flex-col items-center", immersive ? "gap-8" : "gap-5")}
      aria-live="off"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-muted">
        {sessionLabel(sessionType)}
      </p>
      <div
        className={cn(
          "flip-clock flex items-center",
          immersive ? "text-[clamp(4.5rem,14vmin,10rem)]" : "text-[clamp(3rem,9vw,5.4rem)]",
        )}
        role="img"
        aria-label={`${sessionLabel(sessionType)} remaining ${
          ready ? text : "not ready"
        }`}
      >
        {text.split("").map((character, index) =>
          character === ":" ? (
            <span key={`${text.length}-${index}`} className="flip-colon" aria-hidden="true">
              :
            </span>
          ) : (
            <FlipDigit key={`${text.length}-${index}`} value={character} />
          ),
        )}
      </div>
      <p className="text-sm text-muted">{statusLabel(status)}</p>
    </div>
  );
}
