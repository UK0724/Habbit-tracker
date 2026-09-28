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
    Date
  });
  return moduleObject.exports;
};
const noImports = (name) => {
  throw new Error(`Unexpected import: ${name}`);
};

const onboarding = load(path.join(__dirname, "../src/utils/onboarding.ts"), noImports);

// ── Seen key: one per account, always a valid SecureStore key ──
const key = onboarding.onboardingSeenKey("64f1a2b3c4d5e6f708091a2b");
assert.equal(key, "pulse_walkthrough_seen_v1_64f1a2b3c4d5e6f708091a2b");
assert.notEqual(key, onboarding.onboardingSeenKey("64f1a2b3c4d5e6f708091a2c"), "Keys are per user");
assert.match(onboarding.onboardingSeenKey("we!rd id/ü@x"), /^[A-Za-z0-9._-]+$/, "SecureStore-safe key");
assert.ok(onboarding.onboardingSeenKey("u1").startsWith(onboarding.ONBOARDING_SEEN_KEY_PREFIX));

// ── Counting habits ──
assert.equal(onboarding.countTrackableHabits(undefined), 0);
assert.equal(onboarding.countTrackableHabits(null), 0);
assert.equal(onboarding.countTrackableHabits([]), 0);
assert.equal(onboarding.countTrackableHabits([{ type: "expense" }]), 0, "Expense trackers are not habits");
assert.equal(
  onboarding.countTrackableHabits([{ type: "action", archived: true }, { type: "measurable" }]),
  2,
  "Archived habits still make the account not new"
);

// ── Should the walkthrough auto-show? ──
const base = {
  userId: "u1",
  habitsReady: true,
  trackableHabits: 0,
  seen: "unseen",
  shownThisSession: false,
  celebrationActive: false,
  alreadyOpen: false,
  onToday: true
};
const show = (overrides) => onboarding.shouldAutoShowWalkthrough({ ...base, ...overrides });
assert.equal(show({}), true, "Zero habits + not seen + nothing on screen");
assert.equal(show({ trackableHabits: 1 }), false, "Only for accounts with zero habits");
assert.equal(show({ seen: "seen" }), false, "Once per account");
assert.equal(show({ seen: "loading" }), false, "Waits for storage");
assert.equal(show({ shownThisSession: true }), false, "Storage failed: once per app session");
assert.equal(show({ celebrationActive: true }), false, "Never over a celebration / streak-lost sheet");
assert.equal(show({ habitsReady: false }), false, "Waits for the real habits list");
assert.equal(show({ userId: null }), false, "Signed in only");
assert.equal(show({ userId: "" }), false);
assert.equal(show({ alreadyOpen: true }), false, "No double open");
assert.equal(show({ onToday: false }), false, "Never over a form");

// A requested walkthrough waits for celebrations to finish, then comes back.
assert.equal(onboarding.walkthroughVisible(true, false), true);
assert.equal(onboarding.walkthroughVisible(true, true), false);
assert.equal(onboarding.walkthroughVisible(false, false), false);

// ── Paging ──
assert.equal(onboarding.WALKTHROUGH_STEP_COUNT, 4);
assert.equal(onboarding.clampStep(-1), 0);
assert.equal(onboarding.clampStep(9), 3);
assert.equal(onboarding.clampStep(Number.NaN), 0);
assert.equal(onboarding.stepFromOffset(0, 400), 0);
assert.equal(onboarding.stepFromOffset(801, 400), 2);
assert.equal(onboarding.stepFromOffset(10000, 400), 3);
assert.equal(onboarding.stepFromOffset(400, 0), 0, "Zero width never divides by zero");

// ── Templates validate against the real server create-habit schema ──
const { z } = require("zod");
const validation = load(
  path.join(__dirname, "../../server/src/modules/habits/habit.validation.ts"),
  (name) => {
    if (name === "zod") return { z };
    if (name === "./habit.model.js")
      return {
        HABIT_TYPES: ["action", "measurable", "expense"],
        GOAL_DIRECTIONS: ["up", "down", "range", "record"]
      };
    if (name === "../../utils/date.js")
      return { dateStringSchemaMessage: { message: "Invalid date" }, isValidDateString: () => true };
    throw new Error(`Unexpected import: ${name}`);
  }
);
// Keep the stubbed enums honest.
const modelSource = fs.readFileSync(
  path.join(__dirname, "../../server/src/modules/habits/habit.model.ts"),
  "utf8"
);
assert.match(modelSource, /HABIT_TYPES = \["action", "measurable", "expense"\]/);
assert.match(modelSource, /GOAL_DIRECTIONS = \["up", "down", "range", "record"\]/);

const templates = onboarding.HABIT_TEMPLATES;
assert.deepEqual(
  plain(templates.map((template) => template.title)),
  ["Drink water", "Read 10 pages", "Walk 20 minutes"]
);
for (const template of templates) {
  // JSON round trip: what actually goes over the wire.
  const payload = plain(onboarding.templatePayload(template));
  const parsed = validation.createHabitBodySchema.safeParse(payload);
  assert.ok(parsed.success, `${template.title}: ${JSON.stringify(parsed.error?.issues)}`);
  assert.equal(payload.schedule, "daily");
  assert.equal(payload.goalDirection, "up");
  assert.match(payload.color, /^#[0-9A-F]{6}$/i);
  // Service-level rules (habit.service.ts createHabit / ensureHabitConfiguration).
  if (payload.type === "action") {
    assert.equal(payload.unit, undefined, "Action habits cannot define a unit");
    assert.equal(payload.target, null);
  }
}
const water = plain(onboarding.templatePayload(templates[0]));
assert.equal(water.type, "action");
const read = plain(onboarding.templatePayload(templates[1]));
assert.deepEqual(
  { type: read.type, unit: read.unit, target: read.target, goalDirection: read.goalDirection },
  { type: "measurable", unit: "pages", target: 10, goalDirection: "up" }
);
assert.equal(read.requireCompletionComment, undefined, "Comments are only for action habits");
const walk = plain(onboarding.templatePayload(templates[2]));
assert.equal(walk.type, "action");

// The schema really rejects broken payloads (so the checks above mean something).
assert.equal(validation.createHabitBodySchema.safeParse({ ...read, unit: undefined }).success, false);
assert.equal(validation.createHabitBodySchema.safeParse({ ...water, unit: "cups" }).success, false);

// ── Replays: templates already added are marked, archived ones are not ──
assert.equal(onboarding.templateAlreadyAdded([{ type: "action", title: " drink WATER " }], templates[0]), true);
assert.equal(
  onboarding.templateAlreadyAdded([{ type: "action", title: "Drink water", archived: true }], templates[0]),
  false
);
assert.equal(onboarding.templateAlreadyAdded(undefined, templates[0]), false);

// ── Toast: "Day 1" only when the server actually started the streak ──
assert.equal(onboarding.habitCreatedToast(0, "Drink water"), "Day 1 🔥 — your streak has started");
assert.equal(onboarding.FIRST_HABIT_TOAST, "Day 1 🔥 — your streak has started");
assert.equal(onboarding.habitCreatedToast(2, "Drink water"), '"Drink water" added ✓');

// ── Wiring (static): host mounted once, replay entry points present ──
const read_ = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const appLayout = read_("app/(app)/_layout.tsx");
assert.match(appLayout, /<WalkthroughHost \/>/);
assert.match(appLayout, /useDailyCheckin\(\)/, "Check-in still runs");
assert.match(appLayout, /useTimezoneSync\(\)/, "Timezone sync still runs");
assert.match(appLayout, /syncHabitReminders/, "Reminders still sync");
const rootLayout = read_("app/_layout.tsx");
assert.match(rootLayout, /<CelebrationHost \/>/);
assert.match(rootLayout, /<ShareCardHost \/>/);
assert.match(rootLayout, /useOnboardingStore\.getState\(\)\.reset\(\)/, "Sign-out closes the walkthrough");
assert.match(read_("app/(app)/profile.tsx"), /onPress=\{openWalkthrough\}/);
const todayScreen = read_("app/(app)/index.tsx");
assert.match(todayScreen, /Add your first habit to start your streak 🔥/);
assert.match(todayScreen, /onPress=\{openWalkthrough\}/);
assert.doesNotMatch(todayScreen, /Start your first quest/, "One zero-habit card, not two");
const walkthrough = read_("src/components/Walkthrough.tsx");
assert.match(walkthrough, /onRequestClose=\{onClose\}/, "Android back closes (skips) it");
assert.match(walkthrough, /statusBarTranslucent/);
assert.match(walkthrough, /accessibilityViewIsModal/);
assert.match(walkthrough, /pagingEnabled/);
assert.match(walkthrough, /announceForAccessibility/);
assert.match(walkthrough, /withAnchor: true/);

console.log("onboarding checks passed");
