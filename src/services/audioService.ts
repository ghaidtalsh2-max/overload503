// audio.ts — Web Audio engine for 503: OVERLOAD. No audio files. Browsers block audio until a user gesture,
// so call initAudio() from the first click (JOIN on phones, an "ENABLE SOUND" overlay/START on the host screen).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let hum: { stop: () => void } | null = null;
let siren: { stop: () => void } | null = null;
let beatTimer: number | null = null;

export interface SoundLogEntry {
  sound: string;
  timestamp: number;
}

const soundLog: SoundLogEntry[] = [];
let soundCallback: ((sound: string, timestamp: number) => void) | null = null;

function recordSound(name: string) {
  const entry = { sound: name, timestamp: Date.now() };
  soundLog.push(entry);
  if (typeof window !== 'undefined') {
    (window as any).__OVL2_LAST_SOUND__ = entry;
    (window as any).__OVL2_SOUND_LOG__ = soundLog;
  }
  soundCallback?.(name, entry.timestamp);
}

export function getSoundLog(): SoundLogEntry[] {
  return [...soundLog];
}

export function clearSoundLog(): void {
  soundLog.length = 0;
  if (typeof window !== 'undefined') {
    (window as any).__OVL2_SOUND_LOG__ = soundLog;
  }
}

export function setSoundCallback(cb: ((sound: string, timestamp: number) => void) | null): void {
  soundCallback = cb;
}

export function initAudio(): void {
  if (!ctx && typeof window !== 'undefined') {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (AC) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.7;
      master.connect(ctx.destination);
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

export function setMuted(m: boolean): void {
  muted = m;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('overload503_muted', String(m));
  }
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.7, ctx.currentTime, 0.05);
}

export const isMuted = () => muted;

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, delay = 0, slideTo?: number) {
  if (!ctx || !master) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, vol = 0.2, freq = 1200, delay = 0, type: BiquadFilterType = 'bandpass') {
  if (!ctx || !master) return;
  const t = ctx.currentTime + delay;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource();
  s.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(master);
  s.start(t);
}

/** One-shot effects */
export const sfx = {
  tick: (combo = 1) => {
    recordSound('tick');
    initAudio();
    tone(520 + Math.min(combo, 8) * 70, 0.09, 'triangle', 0.18);
    tone((520 + Math.min(combo, 8) * 70) * 1.5, 0.07, 'sine', 0.08, 0.03);
  },
  error: () => {
    recordSound('error');
    initAudio();
    tone(150, 0.35, 'sawtooth', 0.22, 0, 70);
    noise(0.25, 0.2, 300);
  },
  keyClick: () => {
    recordSound('keyClick');
    initAudio();
    tone(900, 0.04, 'square', 0.06);
  },
  unlock: () => {
    recordSound('unlock');
    initAudio();
    tone(440, 0.1, 'square', 0.1);
    tone(660, 0.12, 'square', 0.1, 0.1);
    tone(880, 0.2, 'triangle', 0.14, 0.2);
    noise(0.15, 0.08, 3000, 0, 'highpass');
  },
  warn: () => {
    recordSound('warn');
    initAudio();
    for (let i = 0; i < 3; i++) tone(880, 0.12, 'square', 0.12, i * 0.22);
  },
  glitch: () => {
    recordSound('glitch');
    initAudio();
    noise(0.3, 0.25, 2500);
    tone(90, 0.3, 'sawtooth', 0.15, 0, 40);
  },
  whoosh: () => {
    recordSound('whoosh');
    initAudio();
    noise(0.5, 0.15, 800);
  },
  overload: () => {
    recordSound('overload');
    initAudio();
    tone(80, 1.2, 'sawtooth', 0.3, 0, 30);
    noise(1, 0.25, 200, 0, 'lowpass');
  },
  chime: () => {
    recordSound('chime');
    initAudio();
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.8, 'sine', 0.16, i * 0.12));
  },
  rankTick: () => {
    recordSound('rankTick');
    initAudio();
    tone(700, 0.05, 'square', 0.05);
  },
  powerup: () => {
    recordSound('powerup');
    initAudio();
    tone(600, 0.1, 'triangle', 0.15);
    tone(900, 0.15, 'triangle', 0.15, 0.08);
    tone(1200, 0.2, 'triangle', 0.15, 0.16);
  },
};

/** Calm ambient hum for the healthy LOBBY / SECURED phase */
export function startHum(): void {
  recordSound('startHum');
  initAudio();
  if (!ctx || !master || hum) return;
  const g = ctx.createGain();
  g.gain.value = 0;
  g.gain.setTargetAtTime(0.06, ctx.currentTime, 0.8);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  const a = ctx.createOscillator();
  a.frequency.value = 55;
  const b = ctx.createOscillator();
  b.frequency.value = 82.5;
  a.connect(lp);
  b.connect(lp);
  lp.connect(g);
  g.connect(master);
  a.start();
  b.start();
  hum = {
    stop: () => {
      g.gain.setTargetAtTime(0, ctx!.currentTime, 0.3);
      setTimeout(() => {
        a.stop();
        b.stop();
      }, 1200);
    }
  };
}

export function stopHum(): void {
  recordSound('stopHum');
  hum?.stop();
  hum = null;
}

/** Looping siren for the INCIDENT phase */
export function startSiren(): void {
  recordSound('startSiren');
  initAudio();
  if (!ctx || !master || siren) return;
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = 850;
  const lfo = ctx.createOscillator();
  lfo.type = 'triangle';
  lfo.frequency.value = 0.7;
  const depth = ctx.createGain();
  depth.gain.value = 250;
  lfo.connect(depth);
  depth.connect(o.frequency);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2000;
  const g = ctx.createGain();
  g.gain.value = 0;
  g.gain.setTargetAtTime(0.07, ctx.currentTime, 0.2);
  o.connect(lp);
  lp.connect(g);
  g.connect(master);
  o.start();
  lfo.start();
  siren = {
    stop: () => {
      g.gain.setTargetAtTime(0, ctx!.currentTime, 0.2);
      setTimeout(() => {
        o.stop();
        lfo.stop();
      }, 800);
    }
  };
}

export function stopSiren(): void {
  recordSound('stopSiren');
  siren?.stop();
  siren = null;
}

/** Heartbeat for the last 10 seconds of a station (call stopHeartbeat when it ends) */
export function startHeartbeat(bpm = 90): void {
  recordSound('startHeartbeat');
  initAudio();
  if (beatTimer !== null) return;
  const beat = () => {
    tone(60, 0.15, 'sine', 0.4, 0, 40);
    tone(55, 0.18, 'sine', 0.3, 0.18, 35);
  };
  beat();
  beatTimer = window.setInterval(beat, 60000 / bpm);
}

export function stopHeartbeat(): void {
  recordSound('stopHeartbeat');
  if (beatTimer !== null) {
    clearInterval(beatTimer);
    beatTimer = null;
  }
}

export function stopAll(): void {
  recordSound('stopAll');
  stopHum();
  stopSiren();
  stopHeartbeat();
}

/** Backward compatibility adapter */
export const audio = {
  isMuted,
  toggleMute: () => {
    const next = !muted;
    setMuted(next);
    return next;
  },
  playWarningBeep: sfx.warn,
  playSiren: startSiren,
  playHeartbeat: () => sfx.tick(1),
  playUnlockClick: sfx.unlock,
  playSuccessChime: sfx.chime,
  playGlitch: sfx.glitch,
  startCalmHum: startHum,
  stopCalmHum: stopHum,
  getSoundLog,
  clearSoundLog
};
