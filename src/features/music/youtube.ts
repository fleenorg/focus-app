import type { ParsedYouTube } from "@/types/domain";

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{2,64}$/;

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export const YOUTUBE_ERROR_MESSAGES: Record<number, string> = {
  2: "This video ID is invalid.",
  5: "The YouTube player could not play this content.",
  100: "This video is unavailable. It may be private or deleted.",
  101: "The owner of this video does not allow it to be embedded.",
  150: "The owner of this video does not allow it to be embedded.",
};

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, "");
}

function firstPathSegment(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "";
}

function videoFromPath(pathname: string, prefixes: string[]): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  if (!prefixes.includes(parts[0])) {
    return null;
  }
  const id = parts[1];
  return VIDEO_ID.test(id) ? id : null;
}

export function parseYouTubeUrl(
  input: string,
): { ok: true; value: ParsedYouTube } | { ok: false; message: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, message: "Paste a YouTube URL to load focus audio." };
  }
  if (/<|>|javascript:/i.test(trimmed)) {
    return {
      ok: false,
      message: "That does not look like a YouTube URL.",
    };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return {
      ok: false,
      message: "Enter a full YouTube URL, including https://.",
    };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, message: "Only http(s) YouTube URLs are supported." };
  }

  const host = normalizeHost(url.hostname);
  if (!ALLOWED_HOSTS.has(host)) {
    return {
      ok: false,
      message: "Only YouTube and YouTube Music URLs can be loaded.",
    };
  }

  const isShortHost = host === "youtu.be" || host === "www.youtu.be";
  if (isShortHost) {
    const id = firstPathSegment(url.pathname);
    if (!VIDEO_ID.test(id)) {
      return { ok: false, message: "Could not find a valid video ID in that link." };
    }
    return { ok: true, value: { kind: "video", videoId: id } };
  }

  const path = url.pathname.replace(/\/+$/, "");
  const playlistId = url.searchParams.get("list");
  const isPlaylistPath = path === "/playlist" || path.endsWith("/playlist");

  if (isPlaylistPath) {
    if (!playlistId || !PLAYLIST_ID.test(playlistId)) {
      return {
        ok: false,
        message: "Could not find a valid playlist ID in that link.",
      };
    }
    return { ok: true, value: { kind: "playlist", playlistId } };
  }

  const watchId = url.searchParams.get("v");
  if (watchId && VIDEO_ID.test(watchId)) {
    return { ok: true, value: { kind: "video", videoId: watchId } };
  }

  const nestedVideo = videoFromPath(path, ["embed", "shorts", "live", "v"]);
  if (nestedVideo) {
    return { ok: true, value: { kind: "video", videoId: nestedVideo } };
  }

  return {
    ok: false,
    message: "That YouTube URL format is not supported.",
  };
}

export function playerErrorMessage(code: number): string {
  return (
    YOUTUBE_ERROR_MESSAGES[code] ??
    "The YouTube player could not load this content."
  );
}
