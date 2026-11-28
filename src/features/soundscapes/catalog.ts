/**
 * Ambient voices are synthesized in the Web Audio engine so playback does not
 * depend on a remote file. Licensed recordings can replace a voice later by
 * setting `src` in `public/soundscapes/manifest.json` and teaching the engine
 * to prefer that file. Until then, `src` stays null and nothing is fetched.
 */
export interface SoundscapeDefinition {
  id: string;
  label: string;
  summary: string;
  src: string | null;
}

export const SOUNDSCAPES: SoundscapeDefinition[] = [
  { id: "rain", label: "Rain", summary: "Steady rainfall", src: null },
  { id: "fireplace", label: "Fireplace", summary: "Gentle crackle", src: null },
  { id: "forest", label: "Forest", summary: "Birds and outdoor air", src: null },
  { id: "ocean", label: "Ocean", summary: "Waves on a shore", src: null },
  { id: "brown", label: "Brown noise", summary: "Low, even rumble", src: null },
  { id: "white", label: "White noise", summary: "Even broadband hiss", src: null },
  { id: "cafe", label: "Café", summary: "Soft room murmur", src: null },
];

export function isSoundscapeId(value: string): boolean {
  return SOUNDSCAPES.some((sound) => sound.id === value);
}
