interface FullscreenCapable extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

export function currentFullscreenElement(): Element | null {
  if (typeof document === "undefined") {
    return null;
  }
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export async function enterFullscreen(node: HTMLElement): Promise<void> {
  if (typeof node.requestFullscreen === "function") {
    await node.requestFullscreen();
    return;
  }
  const webkit = (node as FullscreenCapable).webkitRequestFullscreen;
  if (webkit) {
    await webkit.call(node);
    return;
  }
  throw new Error("Fullscreen is not supported in this browser.");
}

export async function exitFullscreen(): Promise<void> {
  if (typeof document === "undefined") {
    return;
  }
  if (typeof document.exitFullscreen === "function" && document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  const doc = document as FullscreenDocument;
  if (doc.webkitExitFullscreen && doc.webkitFullscreenElement) {
    await doc.webkitExitFullscreen();
  }
}
