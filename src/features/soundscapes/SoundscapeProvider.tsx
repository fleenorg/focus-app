"use client";

import { STORAGE_KEYS } from "@/config/app";
import {
  DEFAULT_SOUNDSCAPE_PREFS,
  parseSoundscapePrefs,
  type SoundscapePrefs,
} from "@/features/soundscapes/prefs";
import { SoundscapeMixer } from "@/features/soundscapes/engine";
import { readJson, writeJson } from "@/lib/storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface SoundscapeValue {
  activeIds: string[];
  volume: number;
  muted: boolean;
  playing: boolean;
  toggleSound: (id: string) => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
}

const SoundscapeContext = createContext<SoundscapeValue | null>(null);

export function SoundscapeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<SoundscapePrefs>(DEFAULT_SOUNDSCAPE_PREFS);
  const [playing, setPlayingState] = useState(false);
  const mixerRef = useRef<SoundscapeMixer | null>(null);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const mixer = useCallback(() => {
    mixerRef.current ??= new SoundscapeMixer();
    return mixerRef.current;
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = readJson(STORAGE_KEYS.soundscape, parseSoundscapePrefs);
    if (stored) {
      setPrefs(stored);
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) {
      return;
    }
    writeJson(STORAGE_KEYS.soundscape, prefs);
  }, [prefs, ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const current = mixer();
    if (!playing || prefs.activeIds.length === 0) {
      void current.stopAll();
      return;
    }
    void current.sync(prefs.activeIds, prefs.volume, prefs.muted);
  }, [mixer, playing, prefs.activeIds, prefs.muted, prefs.volume, ready]);

  useEffect(() => {
    return () => {
      mixerRef.current?.dispose();
      mixerRef.current = null;
    };
  }, []);

  const toggleSound = useCallback((id: string) => {
    setPrefs((current) => {
      const activeIds = current.activeIds.includes(id)
        ? current.activeIds.filter((item) => item !== id)
        : [...current.activeIds, id];
      return { ...current, activeIds };
    });
  }, []);

  const setPlaying = useCallback(
    (next: boolean) => {
      const current = mixer();
      const snapshot = prefsRef.current;
      if (next && snapshot.activeIds.length > 0) {
        void current.sync(snapshot.activeIds, snapshot.volume, snapshot.muted);
      } else {
        void current.stopAll();
      }
      setPlayingState(next);
    },
    [mixer],
  );

  const setVolume = useCallback((volume: number) => {
    setPrefs((current) => ({ ...current, volume }));
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setPrefs((current) => ({ ...current, muted }));
  }, []);

  const value = useMemo<SoundscapeValue>(
    () => ({
      activeIds: prefs.activeIds,
      volume: prefs.volume,
      muted: prefs.muted,
      playing,
      toggleSound,
      setPlaying,
      setVolume,
      setMuted,
    }),
    [playing, prefs.activeIds, prefs.muted, prefs.volume, setMuted, setPlaying, setVolume, toggleSound],
  );

  return (
    <SoundscapeContext.Provider value={value}>{children}</SoundscapeContext.Provider>
  );
}

export function useSoundscapes(): SoundscapeValue {
  const value = useContext(SoundscapeContext);
  if (!value) {
    throw new Error("useSoundscapes must be used within SoundscapeProvider");
  }
  return value;
}
