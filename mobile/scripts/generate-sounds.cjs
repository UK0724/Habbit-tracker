#!/usr/bin/env node
// Synthesizes Pulse's short reward sounds (original, no samples):
//   assets/sounds/xp.wav, achievement.wav, levelup.wav
// 16-bit PCM, mono, 44.1 kHz, each under 1.2 s and deliberately quiet.
// Usage: node scripts/generate-sounds.cjs
const fs = require("node:fs");
const path = require("node:path");

const SAMPLE_RATE = 44100;
const OUT_DIR = path.resolve(__dirname, "../assets/sounds");

const noteHz = (semitonesFromA4) => 440 * Math.pow(2, semitonesFromA4 / 12);
// Semitone offsets from A4.
const N = { C5: 3, D5: 5, E5: 7, G5: 10, A5: 12, B5: 14, C6: 15, E6: 19, G6: 22, C7: 27 };

/**
 * A soft bell-ish voice: sine fundamental + quiet triangle and octave
 * partials, fast attack, exponential decay.
 */
const voice = (buffer, { start, freq, duration, gain = 0.5, decay = 6, attack = 0.006 }) => {
  const first = Math.floor(start * SAMPLE_RATE);
  const length = Math.floor(duration * SAMPLE_RATE);
  for (let i = 0; i < length && first + i < buffer.length; i += 1) {
    const t = i / SAMPLE_RATE;
    const env =
      Math.min(1, t / attack) * Math.exp(-decay * t) *
      // Short release so every note ends at silence (no clicks).
      Math.min(1, (length - i) / (0.02 * SAMPLE_RATE));
    const phase = 2 * Math.PI * freq * t;
    const triangle = (2 / Math.PI) * Math.asin(Math.sin(phase));
    const sample =
      0.72 * Math.sin(phase) +
      0.16 * triangle +
      0.12 * Math.sin(2 * phase) * Math.exp(-4 * t);
    buffer[first + i] += sample * env * gain;
  }
};

const render = (seconds, notes, masterGain) => {
  const buffer = new Float64Array(Math.ceil(seconds * SAMPLE_RATE));
  for (const note of notes) voice(buffer, note);
  let peak = 0;
  for (const value of buffer) peak = Math.max(peak, Math.abs(value));
  const scale = peak > 0 ? masterGain / peak : 0;
  const pcm = Buffer.alloc(buffer.length * 2);
  for (let i = 0; i < buffer.length; i += 1) {
    const value = Math.max(-1, Math.min(1, buffer[i] * scale));
    pcm.writeInt16LE(Math.round(value * 32767), i * 2);
  }
  return pcm;
};

const wav = (pcm) => {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

const SOUNDS = {
  // Two quick rising notes: a light "ding-ding".
  "xp.wav": render(
    0.45,
    [
      { start: 0, freq: noteHz(N.E6), duration: 0.22, gain: 0.5, decay: 14 },
      { start: 0.075, freq: noteHz(N.G6), duration: 0.37, gain: 0.55, decay: 10 }
    ],
    0.32
  ),
  // Major arpeggio with a shimmering top note.
  "achievement.wav": render(
    0.95,
    [
      { start: 0, freq: noteHz(N.C5), duration: 0.5, gain: 0.45, decay: 6 },
      { start: 0.09, freq: noteHz(N.E5), duration: 0.5, gain: 0.45, decay: 6 },
      { start: 0.18, freq: noteHz(N.G5), duration: 0.55, gain: 0.45, decay: 5.5 },
      { start: 0.28, freq: noteHz(N.C6), duration: 0.67, gain: 0.55, decay: 4.5 },
      { start: 0.28, freq: noteHz(N.E6), duration: 0.67, gain: 0.18, decay: 5 }
    ],
    0.34
  ),
  // Ascending fanfare that resolves on a held chord.
  "levelup.wav": render(
    1.15,
    [
      { start: 0, freq: noteHz(N.G5), duration: 0.18, gain: 0.4, decay: 9 },
      { start: 0.1, freq: noteHz(N.C6), duration: 0.18, gain: 0.4, decay: 9 },
      { start: 0.2, freq: noteHz(N.E6), duration: 0.2, gain: 0.4, decay: 9 },
      { start: 0.32, freq: noteHz(N.C5), duration: 0.83, gain: 0.35, decay: 3.2 },
      { start: 0.32, freq: noteHz(N.G5), duration: 0.83, gain: 0.3, decay: 3.2 },
      { start: 0.32, freq: noteHz(N.C6), duration: 0.83, gain: 0.35, decay: 3 },
      { start: 0.32, freq: noteHz(N.G6), duration: 0.83, gain: 0.2, decay: 3.5 },
      { start: 0.34, freq: noteHz(N.C7), duration: 0.6, gain: 0.08, decay: 6 }
    ],
    0.36
  )
};

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, pcm] of Object.entries(SOUNDS)) {
  const file = path.join(OUT_DIR, name);
  fs.writeFileSync(file, wav(pcm));
  console.log(`${name}: ${(pcm.length / 2 / SAMPLE_RATE).toFixed(2)}s, ${fs.statSync(file).size} bytes`);
}
