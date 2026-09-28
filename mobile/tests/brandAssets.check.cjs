const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { expo } = require("../app.json");

const checkPng = (relativePath, minimumSize) => {
  const data = fs.readFileSync(path.resolve(__dirname, "..", relativePath));
  assert.equal(data.subarray(1, 4).toString(), "PNG", `${relativePath}: expected PNG`);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  assert.equal(width, height, `${relativePath}: icon must be square`);
  assert.ok(width >= minimumSize, `${relativePath}: placeholder or undersized image (${width}px)`);
};

checkPng(expo.icon, 1024);
checkPng(expo.android.adaptiveIcon.foregroundImage, 1024);
checkPng(expo.android.adaptiveIcon.monochromeImage, 1024);
checkPng(expo.splash.image, 1024);
const notifications = expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-notifications");
assert.ok(notifications, "Notification icon must be configured for Android");
checkPng(notifications[1].icon, 96);
console.log("Mobile launcher, adaptive, splash and notification asset checks passed");

// Reward sounds: short, quiet 16-bit PCM mono WAVs (regenerate with npm run generate:sounds).
for (const name of ["xp", "achievement", "levelup"]) {
  const file = `assets/sounds/${name}.wav`;
  const data = fs.readFileSync(path.resolve(__dirname, "..", file));
  assert.equal(data.subarray(0, 4).toString(), "RIFF", `${file}: expected RIFF`);
  assert.equal(data.subarray(8, 12).toString(), "WAVE", `${file}: expected WAVE`);
  assert.equal(data.readUInt16LE(20), 1, `${file}: expected PCM`);
  assert.equal(data.readUInt16LE(22), 1, `${file}: expected mono`);
  const rate = data.readUInt32LE(24);
  assert.equal(rate, 44100, `${file}: expected 44.1 kHz`);
  assert.equal(data.readUInt16LE(34), 16, `${file}: expected 16-bit`);
  const samples = data.readUInt32LE(40) / 2;
  assert.ok(samples / rate < 1.2, `${file}: must be shorter than 1.2 s`);
  let peak = 0;
  for (let offset = 44; offset < data.length; offset += 2)
    peak = Math.max(peak, Math.abs(data.readInt16LE(offset)));
  assert.ok(peak > 1000 && peak < 0.5 * 32767, `${file}: should be audible but quiet (peak ${peak})`);
}
console.log("Reward sound asset checks passed");
