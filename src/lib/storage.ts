export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const probe = "__lumen_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readJson<T>(
  key: string,
  parse: (value: unknown) => T | null,
): T | null {
  if (!isStorageAvailable()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const value: unknown = JSON.parse(raw);
    return parse(value);
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  if (!isStorageAvailable()) {
    return false;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: string): void {
  if (!isStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore quota or access errors during cleanup.
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
