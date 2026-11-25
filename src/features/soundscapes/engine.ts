import { SOUNDSCAPES } from "@/features/soundscapes/catalog";

type NoiseKind = "white" | "pink" | "brown";

interface Voice {
  stop: () => void;
}

interface ActiveVoice {
  gain: GainNode;
  voice: Voice;
}

const noiseCache = new WeakMap<AudioContext, Partial<Record<NoiseKind, AudioBuffer>>>();

function noiseBuffer(ctx: AudioContext, kind: NoiseKind): AudioBuffer {
  const cached = noiseCache.get(ctx)?.[kind];
  if (cached) {
    return cached;
  }
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if (kind === "white") {
    for (let index = 0; index < length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
  } else if (kind === "brown") {
    let last = 0;
    for (let index = 0; index < length; index += 1) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[index] = last * 3.4;
    }
  } else {
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[index] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  const bucket = noiseCache.get(ctx) ?? {};
  bucket[kind] = buffer;
  noiseCache.set(ctx, bucket);
  return buffer;
}

function createBed(
  ctx: AudioContext,
  kind: NoiseKind,
  destination: AudioNode,
  options: {
    gain: number;
    type?: BiquadFilterType;
    frequency?: number;
    q?: number;
  },
): Voice {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, kind);
  source.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = options.gain;
  let tail: AudioNode = source;
  if (options.type && options.frequency) {
    const filter = ctx.createBiquadFilter();
    filter.type = options.type;
    filter.frequency.value = options.frequency;
    if (options.q) {
      filter.Q.value = options.q;
    }
    source.connect(filter);
    tail = filter;
  }
  tail.connect(gain);
  gain.connect(destination);
  source.start();
  return {
    stop() {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
      source.disconnect();
      gain.disconnect();
    },
  };
}

function burst(
  ctx: AudioContext,
  destination: AudioNode,
  options: {
    duration: number;
    gain: number;
    frequency: number;
    type: BiquadFilterType;
    q?: number;
  },
) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, "white");
  const filter = ctx.createBiquadFilter();
  filter.type = options.type;
  filter.frequency.value = options.frequency;
  filter.Q.value = options.q ?? 0.7;
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(options.gain, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + options.duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(now);
  source.stop(now + options.duration + 0.02);
  window.setTimeout(() => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  }, (options.duration + 0.1) * 1000);
}

function tone(
  ctx: AudioContext,
  destination: AudioNode,
  from: number,
  to: number,
  peak: number,
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(from, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, to), now + 0.16);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(now);
  oscillator.stop(now + 0.24);
}

function loop(callback: () => void, intervalMs: number): () => void {
  const id = window.setInterval(callback, intervalMs);
  return () => window.clearInterval(id);
}

function merge(voices: Voice[]): Voice {
  return {
    stop() {
      voices.forEach((voice) => voice.stop());
    },
  };
}

function createRain(ctx: AudioContext, destination: AudioNode): Voice {
  const bed = createBed(ctx, "pink", destination, {
    gain: 0.2,
    type: "bandpass",
    frequency: 1100,
    q: 0.6,
  });
  const hiss = createBed(ctx, "white", destination, {
    gain: 0.04,
    type: "highpass",
    frequency: 3500,
  });
  const stopDrops = loop(() => {
    if (Math.random() > 0.55) {
      burst(ctx, destination, {
        duration: 0.12 + Math.random() * 0.08,
        gain: 0.08 + Math.random() * 0.08,
        frequency: 1800 + Math.random() * 2200,
        type: "highpass",
      });
    }
  }, 170);
  return merge([bed, hiss, { stop: stopDrops }]);
}

function createFireplace(ctx: AudioContext, destination: AudioNode): Voice {
  const bed = createBed(ctx, "brown", destination, {
    gain: 0.16,
    type: "lowpass",
    frequency: 280,
  });
  const stopCrackle = loop(() => {
    if (Math.random() > 0.45) {
      burst(ctx, destination, {
        duration: 0.05 + Math.random() * 0.07,
        gain: 0.12 + Math.random() * 0.18,
        frequency: 900 + Math.random() * 1600,
        type: "bandpass",
        q: 1.4,
      });
    }
  }, 140);
  return merge([bed, { stop: stopCrackle }]);
}

function createForest(ctx: AudioContext, destination: AudioNode): Voice {
  const air = createBed(ctx, "pink", destination, {
    gain: 0.045,
    type: "highpass",
    frequency: 700,
  });
  const wind = createBed(ctx, "brown", destination, {
    gain: 0.05,
    type: "lowpass",
    frequency: 220,
  });
  const stopBirds = loop(() => {
    if (Math.random() > 0.4) {
      const base = 900 + Math.random() * 1600;
      tone(ctx, destination, base, base * (0.7 + Math.random() * 0.2), 0.03);
      if (Math.random() > 0.5) {
        window.setTimeout(() => {
          tone(ctx, destination, base * 1.2, base * 0.85, 0.02);
        }, 180);
      }
    }
  }, 2400);
  return merge([air, wind, { stop: stopBirds }]);
}

function createOcean(ctx: AudioContext, destination: AudioNode): Voice {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, "pink");
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 480;
  const gain = ctx.createGain();
  gain.gain.value = 0.18;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const depth = ctx.createGain();
  depth.gain.value = 0.12;
  lfo.connect(depth);
  depth.connect(gain.gain);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start();
  lfo.start();
  const foam = createBed(ctx, "white", destination, {
    gain: 0.03,
    type: "highpass",
    frequency: 2500,
  });
  return {
    stop() {
      try {
        source.stop();
        lfo.stop();
      } catch {
        // Already stopped.
      }
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      lfo.disconnect();
      depth.disconnect();
      foam.stop();
    },
  };
}

function createCafe(ctx: AudioContext, destination: AudioNode): Voice {
  const murmur = createBed(ctx, "pink", destination, {
    gain: 0.07,
    type: "bandpass",
    frequency: 520,
    q: 0.8,
  });
  const room = createBed(ctx, "brown", destination, {
    gain: 0.04,
    type: "lowpass",
    frequency: 240,
  });
  const stopClinks = loop(() => {
    if (Math.random() > 0.55) {
      tone(ctx, destination, 1800 + Math.random() * 800, 900, 0.015);
    }
  }, 4200);
  return merge([murmur, room, { stop: stopClinks }]);
}

const FACTORIES: Record<string, (ctx: AudioContext, destination: AudioNode) => Voice> = {
  rain: createRain,
  fireplace: createFireplace,
  forest: createForest,
  ocean: createOcean,
  brown: (ctx, destination) =>
    createBed(ctx, "brown", destination, { gain: 0.28, type: "lowpass", frequency: 400 }),
  white: (ctx, destination) => createBed(ctx, "white", destination, { gain: 0.12 }),
  cafe: createCafe,
};

export class SoundscapeMixer {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices = new Map<string, ActiveVoice>();
  private fading = new Set<GainNode>();

  private async contextReady(): Promise<AudioContext> {
    if (!this.context || !this.master) {
      const context = new AudioContext();
      const master = context.createGain();
      master.gain.value = 0;
      master.connect(context.destination);
      this.context = context;
      this.master = master;
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    return this.context;
  }

  private setMaster(volume: number, muted: boolean) {
    if (!this.context || !this.master) {
      return;
    }
    const now = this.context.currentTime;
    const target = muted ? 0 : volume;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(Math.max(0, target), now + 0.08);
  }

  private fadeOut(id: string) {
    const active = this.voices.get(id);
    if (!active || !this.context) {
      this.voices.delete(id);
      active?.voice.stop();
      return;
    }
    this.voices.delete(id);
    const { gain, voice } = active;
    this.fading.add(gain);
    const now = this.context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.35);
    window.setTimeout(() => {
      voice.stop();
      gain.disconnect();
      this.fading.delete(gain);
    }, 400);
  }

  async sync(activeIds: string[], volume: number, muted: boolean): Promise<void> {
    const context = await this.contextReady();
    this.setMaster(volume, muted);
    const next = new Set(activeIds.filter((id) => FACTORIES[id] || SOUNDSCAPES.some((item) => item.id === id)));
    for (const id of this.voices.keys()) {
      if (!next.has(id)) {
        this.fadeOut(id);
      }
    }
    for (const id of next) {
      if (this.voices.has(id) || !FACTORIES[id] || !this.master) {
        continue;
      }
      const gain = context.createGain();
      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1, now + 0.4);
      gain.connect(this.master);
      const voice = FACTORIES[id](context, gain);
      this.voices.set(id, { gain, voice });
    }
  }

  async stopAll(): Promise<void> {
    for (const id of [...this.voices.keys()]) {
      this.fadeOut(id);
    }
  }

  dispose() {
    for (const active of this.voices.values()) {
      active.voice.stop();
      active.gain.disconnect();
    }
    this.voices.clear();
    for (const gain of this.fading) {
      gain.disconnect();
    }
    this.fading.clear();
    void this.context?.close();
    this.context = null;
    this.master = null;
  }
}
