"use client";

import { cn } from "@/lib/cn";
import { formatCountdown, sessionLabel } from "@/lib/time";
import type { ClockFaceProps } from "./types";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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
  const [motion, setMotion] = useState<{
    from: string;
    to: string;
    id: number;
  } | null>(null);
  const motionId = useRef(0);

  useEffect(() => {
    if (value === settled || reduceMotion) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      motionId.current += 1;
      setMotion((current) => ({
        from: current?.to ?? settled,
        to: value,
        id: motionId.current,
      }));
    });

    return () => cancelAnimationFrame(frame);
  }, [value, settled, reduceMotion]);

  const displayedValue = reduceMotion ? value : settled;
  const top = motion ? motion.to : displayedValue;
  const bottom = motion ? motion.from : displayedValue;

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
          <span
            key={`front-${motion.id}`}
            className="flip-leaf flip-leaf-front"
          >
            <span>{motion.from}</span>
          </span>
          <span
            key={`back-${motion.id}`}
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
          immersive ? "text-[clamp(5rem,16vmin,12rem)]" : "text-[clamp(3rem,9vw,5.4rem)]",
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
