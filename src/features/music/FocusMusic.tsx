"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGuestApp } from "@/features/app/GuestAppProvider";
import { cn } from "@/lib/cn";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { loadYoutubeIframeApi } from "./loadYoutubeApi";
import { parseYouTubeUrl, playerErrorMessage } from "./youtube";

export function FocusMusic() {
  const { musicUrl, musicCollapsed, setMusicUrl, setMusicCollapsed } = useGuestApp();
  const [draft, setDraft] = useState(musicUrl);
  const [loadedUrl, setLoadedUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hostId = useId().replace(/:/g, "");
  const playerRef = useRef<YT.Player | null>(null);

  useEffect(() => {
    setDraft(musicUrl);
  }, [musicUrl]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  const loadSource = async (url: string) => {
    const parsed = parseYouTubeUrl(url);
    if (!parsed.ok) {
      setError(parsed.message);
      setTitle(null);
      playerRef.current?.destroy();
      playerRef.current = null;
      setLoadedUrl("");
      return;
    }

    setError(null);
    setBusy(true);
    setMusicUrl(url);
    try {
      await loadYoutubeIframeApi();
      playerRef.current?.destroy();
      playerRef.current = new YT.Player(hostId, {
        height: "180",
        width: "100%",
        videoId: parsed.value.kind === "video" ? parsed.value.videoId : undefined,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
          ...(parsed.value.kind === "playlist"
            ? { list: parsed.value.playlistId, listType: "playlist" }
            : {}),
        },
        events: {
          onReady: (event) => {
            const videoTitle = event.target.getVideoData().title;
            setTitle(videoTitle || (parsed.value.kind === "playlist" ? "YouTube playlist" : null));
            setBusy(false);
          },
          onError: (event) => {
            setError(playerErrorMessage(event.data));
            setTitle(null);
            setBusy(false);
          },
        },
      });
      setLoadedUrl(url);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The YouTube player could not start.",
      );
      setBusy(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void loadSource(draft);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Focus Music
          </h2>
          <p className="mt-1 text-xs text-muted">YouTube playback, independent of the timer</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-expanded={!musicCollapsed}
          aria-label={musicCollapsed ? "Expand music panel" : "Collapse music panel"}
          onClick={() => setMusicCollapsed(!musicCollapsed)}
        >
          {musicCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>

      {musicCollapsed ? (
        <p className="mt-3 truncate text-sm text-muted">
          {title ?? (musicUrl || "No YouTube link loaded")}
        </p>
      ) : null}

      <div className={cn(musicCollapsed && "hidden")}>
        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Paste a YouTube or YouTube Music URL"
            aria-label="YouTube URL"
            aria-invalid={Boolean(error)}
          />
          <Button type="submit" variant="primary" disabled={busy}>
            Load
          </Button>
        </form>
        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        {title ? <p className="mt-3 text-sm text-foreground">{title}</p> : null}
        <div className="relative mt-4 aspect-video overflow-hidden rounded-xl bg-background">
          <div id={hostId} className="h-full w-full" />
          {!loadedUrl ? (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm leading-6 text-muted">
              Paste a YouTube video, mix, podcast, or playlist. Some videos cannot be
              embedded, and ads or restrictions are controlled by YouTube.
            </p>
          ) : null}
        </div>
        {loadedUrl ? (
          <Button
            className="mt-3"
            variant="ghost"
            onClick={() => {
              playerRef.current?.destroy();
              playerRef.current = null;
              setLoadedUrl("");
              setTitle(null);
              setDraft("");
              setMusicUrl("");
              setError(null);
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
