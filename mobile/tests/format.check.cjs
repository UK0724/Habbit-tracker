const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const plain = (value) => JSON.parse(JSON.stringify(value));
const load = (file, requireFn) => {
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const moduleObject = { exports: {} };
  vm.runInNewContext(compiled, {
    module: moduleObject,
    exports: moduleObject.exports,
    require: requireFn,
    console,
    setTimeout,
    Date
  });
  return moduleObject.exports;
};

// ── Habit formatters ──
const rules = load(path.join(__dirname, "../../shared/src/lib/rules.ts"), require);
const format = load(path.join(__dirname, "../src/utils/format.ts"), (name) => {
  if (name === "@habit-tracker/shared") return rules;
  throw new Error(`Unexpected import: ${name}`);
});
const base = { id: "h", title: "Run", type: "measurable", unit: "km", goalDirection: "up", createdAt: "2026-01-01T00:00:00Z" };

assert.equal(format.formatSchedule({ schedule: "daily" }), "Daily");
assert.equal(format.formatSchedule({ schedule: "weekdays", weekdays: [5, 1, 2, 3, 4] }), "Mon–Fri");
assert.equal(format.formatSchedule({ schedule: "weekdays", weekdays: [0, 6] }), "Weekends");
assert.equal(format.formatSchedule({ schedule: "weekdays", weekdays: [1, 3, 5] }), "Mon, Wed, Fri");
assert.equal(format.formatSchedule({ schedule: "weekly", timesPerWeek: 3 }), "3× / week");
assert.equal(format.formatSchedule({ schedule: "weekly", timesPerWeek: 1 }), "Once a week");

assert.equal(format.formatGoal({ ...base, target: 5 }), "At least 5 km");
assert.equal(format.formatGoal({ ...base, target: null }), "Record km", "No empty 'Target:  km'");
assert.equal(format.formatGoal({ ...base, unit: "", target: null }), "Record a value");
assert.equal(format.formatGoal({ ...base, goalDirection: "down", target: 2, unit: "" }), "At most 2");
assert.equal(format.formatGoal({ ...base, goalDirection: "range", target: 30, targetMax: 60, unit: "min" }), "30–60 min");
assert.equal(format.xpHint({ type: "action" }), "+10 XP");
assert.equal(format.xpHint({ type: "measurable" }), "5–15 XP");

assert.equal(format.parseNumberInput("2,5"), 2.5, "Comma decimals are accepted");
assert.equal(format.parseNumberInput("  "), null);
assert.equal(format.parseNumberInput("abc"), null);
assert.equal(format.parseNumberInput("10,000"), 10000, "Thousands separators are not decimals");
assert.equal(format.parseNumberInput("1,234,567"), 1234567);
assert.equal(format.parseNumberInput("1,234.5"), 1234.5);
assert.equal(format.parseNumberInput("1,5"), 1.5);
assert.equal(format.parseNumberInput(",5"), 0.5);
assert.equal(format.parseNumberInput("12.75"), 12.75);
assert.equal(format.parseNumberInput(" 42 "), 42);
assert.equal(format.parseNumberInput("1,23,4"), null, "Ambiguous separators are rejected");
assert.equal(format.parseNumberInput("1.234,5"), null);
assert.equal(format.parseNumberInput("1,5.2"), null);
assert.equal(format.parseNumberInput("0x10"), null);
assert.equal(format.parseNumberInput("1e3"), null);
assert.equal(format.plural(1, "day"), "1 day");
assert.equal(format.plural(2, "freeze"), "2 freezes");

// Monday-based week: 2026-09-28 is a Monday.
const weekly = { ...base, type: "action", schedule: "weekly", timesPerWeek: 3 };
const days = [
  { date: "2026-09-27", status: "done", value: null, hasLog: true }, // Sunday, last week
  { date: "2026-09-29", status: "done", value: null, hasLog: true },
  { date: "2026-09-30", status: "skipped", value: null, hasLog: true }
];
assert.deepEqual(plain(format.weeklyProgress(weekly, days, "2026-09-30")), { done: 1, target: 3 });
assert.equal(format.weeklyProgress({ ...weekly, schedule: "daily" }, days, "2026-09-30"), null);
console.log("Habit goal, schedule, XP hint, number parsing and weekly progress checks passed.");

// ── Sound effects: mute setting persists and playback never throws ──
const stored = new Map();
let played = 0;
let failLoad = false;
const sound = load(path.join(__dirname, "../src/utils/sound.ts"), (name) => {
  if (name === "react") return { useEffect: () => undefined, useState: (v) => [v, () => undefined] };
  if (name === "react-native") return { Platform: { OS: "android" } };
  if (name === "../services/storage")
    return {
      getItemAsync: async (key) => stored.get(key) ?? null,
      setItemAsync: async (key, value) => void stored.set(key, value)
    };
  if (name === "expo-av")
    return {
      Audio: {
        setAudioModeAsync: async () => undefined,
        Sound: {
          createAsync: async () => {
            if (failLoad) throw new Error("decoder unavailable");
            return {
              sound: {
                setPositionAsync: async () => undefined,
                playAsync: async () => {
                  played += 1;
                }
              }
            };
          }
        }
      }
    };
  if (name.endsWith(".wav")) return 1;
  throw new Error(`Unexpected import: ${name}`);
});

(async () => {
  assert.equal(await sound.isSoundEnabled(), true, "Sounds are on by default");
  await sound.playSoundEffect("xp");
  assert.equal(played, 1);
  await sound.setSoundEnabled(false);
  assert.equal([...stored.values()][0], "off", "The mute setting is persisted");
  await sound.playSoundEffect("levelup");
  assert.equal(played, 1, "Muted sounds don't play");
  await sound.setSoundEnabled(true);
  await sound.playSoundEffect("achievement");
  assert.equal(played, 2);
  console.log("Sound effect mute and playback checks passed.");

  // A module that fails to load its audio must still resolve quietly.
  failLoad = true;
  const broken = load(path.join(__dirname, "../src/utils/sound.ts"), (name) => {
    if (name === "react") return { useEffect: () => undefined, useState: (v) => [v, () => undefined] };
    if (name === "react-native") return { Platform: { OS: "android" } };
    if (name === "../services/storage") return { getItemAsync: async () => { throw new Error("locked"); }, setItemAsync: async () => undefined };
    if (name === "expo-av") return { Audio: { setAudioModeAsync: async () => { throw new Error("no audio"); }, Sound: { createAsync: async () => { throw new Error("x"); } } } };
    if (name.endsWith(".wav")) return 1;
    throw new Error(`Unexpected import: ${name}`);
  });
  const quietConsole = console.error;
  console.error = () => undefined;
  try {
    await broken.playSoundEffect("xp");
  } finally {
    console.error = quietConsole;
  }
  console.log("Sound failures are swallowed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
