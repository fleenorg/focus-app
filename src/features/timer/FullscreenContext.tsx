"use client";

import {
  currentFullscreenElement,
  enterFullscreen,
  exitFullscreen,
} from "@/features/timer/fullscreen";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface FullscreenValue {
  stageRef: React.RefObject<HTMLDivElement | null>;
  isFullscreen: boolean;
  chromeVisible: boolean;
  toggleFullscreen: () => Promise<boolean>;
}

const FullscreenContext = createContext<FullscreenValue | null>(null);

export function FullscreenProvider({ children }: { children: React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  useEffect(() => {
    const sync = () => {
      const active = currentFullscreenElement() === stageRef.current;
      setIsFullscreen(active);
      if (active) {
        setChromeVisible(true);
      }
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }
    const node = stageRef.current;
    if (!node) {
      return;
    }
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!finePointer) {
      return;
    }
    let hideTimer = window.setTimeout(() => setChromeVisible(false), 3000);
    const show = () => {
      setChromeVisible(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setChromeVisible(false), 3000);
    };
    node.addEventListener("pointermove", show);
    node.addEventListener("pointerdown", show);
    node.addEventListener("focusin", show);
    return () => {
      window.clearTimeout(hideTimer);
      node.removeEventListener("pointermove", show);
      node.removeEventListener("pointerdown", show);
      node.removeEventListener("focusin", show);
    };
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (currentFullscreenElement()) {
        await exitFullscreen();
        return true;
      }
      const node = stageRef.current;
      if (!node) {
        return false;
      }
      await enterFullscreen(node);
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <FullscreenContext.Provider
      value={{ stageRef, isFullscreen, chromeVisible, toggleFullscreen }}
    >
      {children}
    </FullscreenContext.Provider>
  );
}

export function useFullscreen(): FullscreenValue {
  const value = useContext(FullscreenContext);
  if (!value) {
    throw new Error("useFullscreen must be used within FullscreenProvider");
  }
  return value;
}
