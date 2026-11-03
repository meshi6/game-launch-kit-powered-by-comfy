"use client";
// Tiny WebAudio arcade sounds: no assets, instant.
let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}
export function isMuted() {
  return muted;
}

function tone(freq: number, dur: number, type: OscillatorType = "square", gain = 0.05, slideTo?: number, delay = 0) {
  if (muted || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {}
}

export const blip = {
  move: () => tone(660, 0.05, "square", 0.03),
  select: () => { tone(880, 0.07); tone(1320, 0.09, "square", 0.05, undefined, 0.06); },
  back: () => tone(440, 0.08, "square", 0.04, 220),
  start: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "square", 0.05, undefined, i * 0.09)),
  done: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.1, "triangle", 0.06, undefined, i * 0.07)),
};
