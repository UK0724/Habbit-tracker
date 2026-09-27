// Web-Audio-API–based sound engine — no external files needed.
// Each sound is synthesised on demand from simple oscillator + gain configs.

type SoundName =
  | "complete"
  | "legendary"
  | "xp"
  | "levelup"
  | "achievement"
  | "streak"
  | "streakbreak"
  | "restore"
  | "skip";

type SoundConfig = {
  /** Base frequency in Hz. */
  freq: number;
  /** Duration in seconds. */
  dur: number;
  /** OscillatorType. */
  wave: OscillatorType;
  /** Optional second tone for chords/harmonics. */
  freq2?: number;
  /** Gain ramp shape: "decay" (default) | "attack-decay" */
  shape?: "decay" | "attack-decay";
};

const SOUND_CONFIGS: Record<SoundName, SoundConfig> = {
  complete:    { freq: 523,  dur: 0.18, wave: "sine",     freq2: 659,  shape: "attack-decay" },
  xp:          { freq: 880,  dur: 0.10, wave: "sine",     freq2: 1046, shape: "decay"        },
  streak:      { freq: 440,  dur: 0.22, wave: "triangle", freq2: 554,  shape: "attack-decay" },
  legendary:   { freq: 392,  dur: 0.55, wave: "sine",     freq2: 587,  shape: "attack-decay" },
  achievement: { freq: 659,  dur: 0.45, wave: "sine",     freq2: 784,  shape: "attack-decay" },
  levelup:     { freq: 330,  dur: 0.65, wave: "sine",     freq2: 494,  shape: "attack-decay" },
  streakbreak: { freq: 220,  dur: 0.35, wave: "sawtooth", shape: "decay"                     },
  restore:     { freq: 587,  dur: 0.30, wave: "sine",     freq2: 740,  shape: "attack-decay" },
  skip:        { freq: 330,  dur: 0.12, wave: "triangle", shape: "decay"                     },
};

let ctx: AudioContext | null = null;
let soundEnabled = true;

const getCtx = (): AudioContext => {
  if (!ctx) ctx = new AudioContext();
  return ctx;
};

const playTone = (cfg: SoundConfig, audioCtx: AudioContext, when: number) => {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = cfg.wave;
  osc.frequency.setValueAtTime(cfg.freq, when);

  const peak = 0.22;
  if (cfg.shape === "attack-decay") {
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(peak, when + cfg.dur * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, when + cfg.dur);
  } else {
    gain.gain.setValueAtTime(peak, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + cfg.dur);
  }

  osc.start(when);
  osc.stop(when + cfg.dur + 0.01);

  if (cfg.freq2) {
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = cfg.wave;
    osc2.frequency.setValueAtTime(cfg.freq2, when);
    if (cfg.shape === "attack-decay") {
      gain2.gain.setValueAtTime(0, when);
      gain2.gain.linearRampToValueAtTime(peak * 0.7, when + cfg.dur * 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, when + cfg.dur);
    } else {
      gain2.gain.setValueAtTime(peak * 0.7, when);
      gain2.gain.exponentialRampToValueAtTime(0.001, when + cfg.dur);
    }
    osc2.start(when);
    osc2.stop(when + cfg.dur + 0.01);
  }
};

export const playSound = (name: SoundName): void => {
  if (!soundEnabled) return;
  try {
    const audioCtx = getCtx();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const cfg = SOUND_CONFIGS[name];
    const when = audioCtx.currentTime + 0.01;

    // Special multi-note sequences for dramatic sounds
    if (name === "levelup") {
      const notes = [330, 392, 494, 659];
      notes.forEach((freq, i) => {
        playTone({ ...cfg, freq, freq2: undefined }, audioCtx, when + i * 0.12);
      });
      return;
    }
    if (name === "legendary") {
      const notes = [392, 494, 587, 784];
      notes.forEach((freq, i) => {
        playTone({ ...cfg, freq, freq2: i === 3 ? 1047 : undefined }, audioCtx, when + i * 0.13);
      });
      return;
    }
    if (name === "achievement") {
      playTone(cfg, audioCtx, when);
      playTone({ ...cfg, freq: cfg.freq * 1.5, freq2: undefined }, audioCtx, when + 0.18);
      return;
    }

    playTone(cfg, audioCtx, when);
  } catch {
    // AudioContext may be unavailable in some environments — silently ignore
  }
};

export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
};

export const isSoundEnabled = (): boolean => soundEnabled;
