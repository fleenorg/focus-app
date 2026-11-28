"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { SOUNDSCAPES } from "@/features/soundscapes/catalog";
import { useSoundscapes } from "@/features/soundscapes/SoundscapeProvider";
import { cn } from "@/lib/cn";
import { AudioLines, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function SoundscapeControl({ placement = "below" }: { placement?: "below" | "above" }) {
  const {
    activeIds,
    volume,
    muted,
    playing,
    toggleSound,
    setPlaying,
    setVolume,
    setMuted,
  } = useSoundscapes();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const play = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (activeIds.length === 0) {
      notify("Choose a soundscape first.");
      setOpen(true);
      return;
    }
    setPlaying(true);
  };

  return (
    <div ref={panelRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Ambient soundscapes"
        onClick={() => setOpen((current) => !current)}
        className={cn(playing && !muted && "text-accent")}
      >
        <AudioLines className="h-4 w-4" aria-hidden="true" />
      </Button>
      {open ? (
        <div
          role="dialog"
          aria-labelledby={titleId}
          className={cn(
            "absolute right-0 z-40 w-64 rounded-2xl border border-border bg-surface p-3 text-foreground shadow-panel",
            placement === "above" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p id={titleId} className="text-sm font-medium">
              Soundscapes
            </p>
            <Button size="sm" variant="secondary" onClick={play}>
              {playing ? (
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {playing ? "Pause" : "Play"}
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="rounded-full p-1 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={muted ? "Unmute soundscapes" : "Mute soundscapes"}
              aria-pressed={muted}
              onClick={() => setMuted(!muted)}
            >
              {muted ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <input
              aria-label="Soundscape volume"
              className="w-full accent-[var(--accent)]"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
            />
          </div>
          <ul className="mt-3 space-y-1">
            {SOUNDSCAPES.map((sound) => {
              const selected = activeIds.includes(sound.id);
              return (
                <li key={sound.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleSound(sound.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      selected ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2",
                    )}
                  >
                    <span>{sound.label}</span>
                    <span className="text-xs">{selected ? "On" : sound.summary}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs leading-5 text-muted">
            Select one sound, or several to blend them. Audio stays off until you press play.
          </p>
        </div>
      ) : null}
    </div>
  );
}
