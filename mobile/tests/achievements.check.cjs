const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Values from the vm realm have foreign prototypes; compare plain copies.
const plain = (value) => JSON.parse(JSON.stringify(value));

const load = (relativePath, requireFn) => {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, relativePath), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const moduleObject = { exports: {} };
  vm.runInNewContext(compiled, { module: moduleObject, exports: moduleObject.exports, require: requireFn, console });
  return moduleObject.exports;
};

const storeModule = load("../src/stores/achievementStore.ts", require);
const store = storeModule.useCelebrationStore;
assert.equal(storeModule.useAchievementStore, store, "Old store name stays as an alias");
const state = () => store.getState();

// Reward payloads list new unlocks without an `unlocked` field: they must still celebrate.
const first = { id: "first", name: "First", xpBonus: 50, gemBonus: 1, tier: "bronze" };
const second = { ...first, id: "second" };
const third = { ...first, id: "third" };

state().enqueue({ kind: "achievement", achievements: [first] });
assert.equal(state().current.kind, "achievement");
assert.equal(state().current.achievements[0].id, "first", "Badges without `unlocked` are celebrated");
state().enqueue({ kind: "achievement", achievements: [first] });
assert.equal(state().queue.length, 0, "Duplicate events must not queue duplicate celebrations");

// A burst collapses into one sheet.
state().enqueue({ kind: "achievement", achievements: [second, third, second] });
assert.equal(state().queue.length, 1);
assert.deepEqual(plain(state().queue[0].achievements.map((a) => a.id)), ["second", "third"], "Bursts are grouped and de-duplicated");

// Level-up is the finale even if more badges arrive afterwards.
state().enqueue({ kind: "levelUp", level: 5, title: "Adept" });
state().enqueue({ kind: "achievement", achievements: [{ ...first, id: "fourth" }] });
assert.deepEqual(plain(state().queue.map((item) => item.kind)), ["achievement", "achievement", "levelUp"]);
state().enqueue({ kind: "levelUp", level: 5, title: "Adept" });
assert.equal(state().queue.filter((item) => item.kind === "levelUp").length, 1, "A level-up is shown once");

// Streak-lost sheets never stack.
state().enqueue({ kind: "streak", previousStreak: 9, canRestore: true, restoreCost: 5, restoreExpiresAt: null });
state().enqueue({ kind: "streak", previousStreak: 9, canRestore: true, restoreCost: 5, restoreExpiresAt: null });
assert.equal(state().queue.filter((item) => item.kind === "streak").length, 1);
assert.equal(state().queue.at(-1).kind, "levelUp", "Streak sheet queues ahead of the level-up finale");

// Dismiss walks the queue in order.
const order = [state().current.kind];
while (state().current) {
  state().dismiss();
  if (state().current) order.push(state().current.kind);
}
assert.deepEqual(plain(order), ["achievement", "achievement", "achievement", "streak", "levelUp"]);

// Explicitly locked badges are never celebrated; dismissed ones don't replay.
state().enqueue({ kind: "achievement", achievements: [{ ...first, id: "locked", unlocked: false }] });
assert.equal(state().current, null, "Locked badges cannot be celebrated");
state().enqueue({ kind: "achievement", achievements: [first] });
assert.equal(state().current, null, "Dismissed celebrations must not replay");

// Details mode (Trophy Room) works for locked and unlocked badges and awards nothing.
state().viewAchievement({ ...first, id: "locked", unlocked: false });
assert.equal(state().current.mode, "details");
const celebratedBefore = state().celebrated.length;
state().dismiss();
state().viewAchievement(first);
assert.equal(state().current.mode, "details", "Repeated previews stay in details mode");
assert.equal(state().celebrated.length, celebratedBefore, "Viewing details must not enqueue anything");
state().dismiss();

// XP toast: separate non-modal slot; zero rewards are ignored.
state().enqueue({ kind: "xp", xp: 0, gems: 0, legendaryDay: false });
assert.equal(state().toast, null, "Empty rewards show no toast");
state().enqueue({ kind: "xp", xp: 35, gems: 1, legendaryDay: true });
assert.equal(state().toast.xp, 35);
assert.equal(state().current, null, "Toasts never block the modal queue");
state().enqueue({ kind: "xp", xp: -10, gems: 0, legendaryDay: false });
assert.equal(state().toast.xp, -10, "Undo shows a (muted) negative toast");
state().dismissToast();
assert.equal(state().toast, null);

state().reset();
assert.equal(state().current, null);
assert.equal(state().queue.length, 0);
assert.equal(state().celebrated.length, 0, "Account changes must reset session state");
console.log("Celebration queue: ordering, bursts, de-duplication, details, toasts and reset checks passed.");

// ── Reward routing (useRewardCelebration) ──
const enqueued = [];
const invalidated = [];
const hook = load("../src/hooks/useRewardCelebration.ts", (name) => {
  if (name === "react") return { useCallback: (fn) => fn };
  if (name === "@tanstack/react-query") return { useQueryClient: () => null };
  if (name === "../stores/achievementStore")
    return { useCelebrationStore: { getState: () => ({ enqueue: (item) => enqueued.push(item) }) } };
  throw new Error(`Unexpected import: ${name}`);
});
const queryClient = { invalidateQueries: ({ queryKey }) => invalidated.push(queryKey[0]) };

hook.celebrateReward(queryClient, undefined);
assert.deepEqual(plain(invalidated.sort()), ["achievements", "gamificationProfile"], "Missing reward still refreshes progress");
assert.equal(enqueued.length, 0, "Missing reward degrades gracefully");

hook.celebrateReward(queryClient, {
  xpAwarded: 35,
  gemsAwarded: 1,
  legendaryDay: true,
  newAchievements: [first],
  levelUp: { level: 6, title: "Achiever" },
  checkin: { alreadyCheckedIn: false, streak: 1, xpAwarded: 5, streakBroken: true, freezeUsed: false, previousStreak: 12, canRestore: true, restoreCost: 5, restoreExpiresAt: null }
});
assert.deepEqual(plain(enqueued.map((item) => item.kind)), ["xp", "achievement", "streak", "levelUp"]);
assert.equal(enqueued[0].xp, 35, "Log XP excludes the automatic check-in");
assert.deepEqual(plain(enqueued[0].checkin), { xp: 5, streak: 1 }, "Ride-along check-in XP is shown separately");
assert.equal(enqueued[2].previousStreak, 12);

// The check-in endpoint: its top-level xpAwarded is the check-in XP.
enqueued.length = 0;
const direct = { alreadyCheckedIn: false, streak: 4, xpAwarded: 5, streakBroken: false, freezeUsed: false, newAchievements: [], levelUp: null, gemsAwarded: 0, checkin: null };
hook.celebrateReward(queryClient, direct, { checkin: direct });
assert.equal(enqueued[0].xp, 0);
assert.deepEqual(plain(enqueued[0].checkin), { xp: 5, streak: 4 });

enqueued.length = 0;
hook.celebrateReward(queryClient, { xpAwarded: 10 }); // partial reward from an older server
assert.deepEqual(plain(enqueued.map((item) => item.kind)), ["xp"]);
enqueued.length = 0;
hook.celebrateReward(queryClient, { xpAwarded: 0, checkin: { streakBroken: true, freezeUsed: true } });
assert.equal(enqueued.some((item) => item.kind === "streak"), false, "A used freeze means the streak was saved");
console.log("Reward routing: toast → badges → streak → level-up, partial and missing rewards passed.");

// ── Check-in without a habit (needsHabit) and message toasts (streak repair) ──
enqueued.length = 0;
invalidated.length = 0;
const noHabit = { alreadyCheckedIn: false, needsHabit: true, streak: 0, xpAwarded: 0, streakBroken: false, freezeUsed: false, newAchievements: [], levelUp: null, gemsAwarded: 0 };
hook.celebrateReward(queryClient, noHabit, { checkin: noHabit });
assert.equal(enqueued.length, 0, "needsHabit check-ins are a no-op: no toast");
assert.ok(invalidated.includes("gamificationProfile"), "needsHabit still refreshes the profile");

enqueued.length = 0;
hook.celebrateReward(
  queryClient,
  { xpAwarded: 0, gemsAwarded: 0, newAchievements: [{ ...first, id: "second_chance" }], levelUp: null },
  { message: "Streak repaired ❄️" }
);
assert.deepEqual(plain(enqueued.map((item) => item.kind)), ["xp", "achievement"]);
assert.equal(enqueued[0].message, "Streak repaired ❄️", "Repair toast carries its message");

state().reset();
state().enqueue({ kind: "xp", xp: 0, gems: 0, legendaryDay: false, message: "Streak repaired ❄️" });
assert.equal(state().toast.message, "Streak repaired ❄️", "A message-only toast is shown");
state().reset();
console.log("needsHabit check-ins and message toasts passed.");
