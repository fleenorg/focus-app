import { isSoundscapeId } from "@/features/soundscapes/catalog";
import { asBoolean, asFiniteNumber, isRecord } from "@/lib/storage";
import { clamp } from "@/lib/time";

export interface SoundscapePrefs {
  activeIds: string[];
  volume: number;
  muted: boolean;
}

export const DEFAULT_SOUNDSCAPE_PREFS: SoundscapePrefs = {
  activeIds: [],
  volume: 0.6,
  muted: false,
};

export function parseSoundscapePrefs(value: unknown): SoundscapePrefs | null {
  if (!isRecord(value)) {
    return null;
  }
  const activeIds = Array.isArray(value.activeIds)
    ? value.activeIds.filter(
        (id): id is string => typeof id === "string" && isSoundscapeId(id),
      )
    : [];
  const volume = asFiniteNumber(value.volume);
  return {
    activeIds: [...new Set(activeIds)],
    volume: clamp(volume ?? DEFAULT_SOUNDSCAPE_PREFS.volume, 0, 1),
    muted: asBoolean(value.muted, false),
  };
}
