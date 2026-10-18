export function playCompletionChime(): void {
  if (typeof window === "undefined") {
    return;
  }
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }
  const context = new AudioContextCtor();
  const now = context.currentTime;
  const notes = [523.25, 659.25];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.18);
    gain.gain.setValueAtTime(0.0001, now + index * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.07, now + index * 0.18 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + index * 0.18);
    oscillator.stop(now + index * 0.18 + 0.3);
  });

  window.setTimeout(() => {
    void context.close();
  }, 800);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
