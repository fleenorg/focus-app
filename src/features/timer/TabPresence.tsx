"use client";

import { APP } from "@/config/app";
import { useGuestApp } from "@/features/app/GuestAppProvider";
import { formatDocumentTitle } from "@/lib/time";
import { useEffect, useRef } from "react";

function drawFavicon(
  canvas: HTMLCanvasElement,
  progress: number,
  mode: "idle" | "running" | "paused" | "complete",
) {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim() || "#5ec2b3";
  const foreground = styles.getPropertyValue("--foreground").trim() || "#ecece8";
  const muted = styles.getPropertyValue("--border-strong").trim() || "#3a3a44";
  const size = canvas.width;
  const center = size / 2;
  context.clearRect(0, 0, size, size);
  context.beginPath();
  context.arc(center, center, center - 1.5, 0, Math.PI * 2);
  context.strokeStyle = muted;
  context.lineWidth = 2;
  context.stroke();

  if (mode === "complete") {
    context.strokeStyle = accent;
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(9, 16);
    context.lineTo(14, 21);
    context.lineTo(23, 11);
    context.stroke();
    return;
  }

  if (mode !== "idle") {
    context.strokeStyle = accent;
    context.lineWidth = 3;
    context.lineCap = "round";
    context.beginPath();
    context.arc(
      center,
      center,
      center - 3,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * Math.min(1, Math.max(0, progress)),
    );
    context.stroke();
  }

  if (mode === "paused") {
    context.fillStyle = foreground;
    context.fillRect(11, 10, 3.5, 12);
    context.fillRect(17.5, 10, 3.5, 12);
    return;
  }

  if (mode === "idle") {
    context.fillStyle = accent;
    context.beginPath();
    context.arc(center, center, 4, 0, Math.PI * 2);
    context.fill();
  }
}

function applyFavicon(href: string) {
  const links = document.querySelectorAll<HTMLLinkElement>("link[rel='icon']");
  if (links.length === 0) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
    link.href = href;
    return;
  }
  links.forEach((link) => {
    link.type = "image/png";
    link.href = href;
  });
}

export function TabPresence() {
  const { timer, settings, ready, lastCompletedAt } = useGuestApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const title = formatDocumentTitle(timer, APP.name);
  const progress = timer.durationMs === 0 ? 0 : 1 - timer.remainingMs / timer.durationMs;
  const bucket = Math.floor(timer.remainingMs / 15_000);
  const completed =
    lastCompletedAt !== null && Date.now() - lastCompletedAt < 8_000;

  useEffect(() => {
    if (!ready) {
      return;
    }
    document.title = title;
  }, [ready, title]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    canvasRef.current = canvas;
    const mode = completed
      ? "complete"
      : timer.status === "paused"
        ? "paused"
        : timer.status === "running"
          ? "running"
          : "idle";
    drawFavicon(canvas, progress, mode);
    applyFavicon(canvas.toDataURL("image/png"));
  }, [
    ready,
    timer.status,
    timer.sessionType,
    settings.theme,
    bucket,
    completed,
    progress,
    lastCompletedAt,
  ]);

  return null;
}
