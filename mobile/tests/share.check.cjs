const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const plain = (value) => JSON.parse(JSON.stringify(value));
const load = (file) => {
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const moduleObject = { exports: {} };
  vm.runInNewContext(compiled, {
    module: moduleObject,
    exports: moduleObject.exports,
    require: (name) => {
      throw new Error(`Unexpected import: ${name}`);
    },
    console
  });
  return moduleObject.exports;
};

const share = load(path.join(__dirname, "../src/utils/share.ts"));
const profile = {
  level: 6,
  levelTitle: "On Track",
  loginStreak: 12,
  achievementCount: 9,
  achievementTotal: 31,
  totalXP: 12400
};
const badge = { kind: "achievement", achievement: { name: "Second Chance", emoji: "❄️", description: "Repair a streak" } };

// ── Headlines ──
assert.equal(share.buildShareHeadline(badge, profile), "Unlocked Second Chance ❄️");
assert.equal(share.buildShareHeadline({ kind: "levelUp", level: 6, title: "On Track" }, profile), "Reached Level 6 · On Track");
assert.equal(
  share.buildShareHeadline({ kind: "levelUp", level: 7, title: "" }, profile),
  "Reached Level 7 · On Track",
  "A missing title falls back to the profile's"
);
assert.equal(share.buildShareHeadline({ kind: "progress" }, profile), "12-day streak 🔥");
assert.equal(share.buildShareHeadline({ kind: "progress" }, { ...profile, loginStreak: 0 }), "Level 6 · On Track");
assert.equal(share.buildShareHeadline({ kind: "progress" }, null), "Building better habits", "No profile never crashes");

// ── Stats row ──
assert.deepEqual(plain(share.buildShareStats({ kind: "progress" }, profile)), [
  { label: "Level", value: "6" },
  { label: "Streak", value: "12 days" },
  { label: "Badges", value: "9/31" },
  { label: "Total XP", value: "12.4K" }
]);
// A level-up can arrive before the profile refetches: show the new level.
assert.equal(share.buildShareStats({ kind: "levelUp", level: 7 }, profile)[0].value, "7");
const empty = plain(share.buildShareStats({ kind: "progress" }, {}));
assert.deepEqual(empty.map((stat) => stat.value), ["1", "0 days", "0", "0"]);
assert.equal(share.buildShareStats({ kind: "progress" }, { loginStreak: 1 })[1].value, "1 day");

assert.equal(share.compactNumber(950), "950");
assert.equal(share.compactNumber(9999), "9,999");
assert.equal(share.compactNumber(10000), "10K");
assert.equal(share.compactNumber(1250000), "1.3M");

// ── Text fallback keeps the old wording + link ──
assert.equal(
  share.buildShareMessage(badge, profile),
  'I just unlocked "Second Chance" ❄️ on Pulse!\nhttps://habbit.abuk.in'
);
assert.equal(
  share.buildShareMessage({ kind: "levelUp", level: 6, title: "On Track" }),
  "I just reached Level 6 (On Track) on Pulse!\nhttps://habbit.abuk.in"
);
assert.equal(
  share.buildShareMessage({ kind: "progress" }, profile),
  "I'm Level 6 (On Track) on Pulse with a 12 days streak and 9 badges!\nhttps://habbit.abuk.in"
);

assert.equal(share.SHARE_FOOTER, "Build habits with me → habbit.abuk.in");
assert.equal(share.avatarInitial("sam@example.com"), "S");
assert.equal(share.avatarInitial("_42@x.io"), "4");
assert.equal(share.avatarInitial(""), "P");
assert.equal(share.avatarInitial(undefined), "P");

console.log("Share card helper checks passed");
