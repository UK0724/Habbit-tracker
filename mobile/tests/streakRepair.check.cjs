const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

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
    console,
    Date
  });
  return moduleObject.exports;
};

const repair = load(path.join(__dirname, "../src/utils/streakRepair.ts"));
const offer = { date: "2026-09-26", freezeCost: 1, gemCost: 3 };

// ── Banner copy ──
assert.equal(repair.repairDayLabel("2026-09-26"), "Sat, Sep 26");
assert.equal(repair.repairDayLabel("2026-01-01"), "Thu, Jan 1");
assert.equal(repair.repairDayLabel("not-a-date"), "not-a-date", "Bad dates never crash the banner");
assert.equal(repair.repairHeadline(offer), "Streak broken on Sat, Sep 26");

// ── Paying: a freeze first, then gems, else disabled ──
const withFreeze = repair.planRepair(offer, { streakFreezes: 2, gems: 0 });
assert.equal(withFreeze.payWith, "freeze");
assert.equal(withFreeze.affordable, true);
assert.equal(withFreeze.label, "Repair for 🛡️1");
assert.match(withFreeze.confirm, /1 streak freeze/);
assert.match(withFreeze.confirm, /Sat, Sep 26/);

const withGems = repair.planRepair(offer, { streakFreezes: 0, gems: 3 });
assert.equal(withGems.payWith, "gems");
assert.equal(withGems.affordable, true);
assert.equal(withGems.label, "Repair for 💎3");
assert.match(withGems.confirm, /3 gems/);

const broke = repair.planRepair(offer, { streakFreezes: 0, gems: 2 });
assert.equal(broke.affordable, false);
assert.equal(broke.label, "Need 💎3 (you have 2)");
assert.equal(broke.confirm, null, "An unaffordable repair has no confirm step");

const unknown = repair.planRepair(offer, null);
assert.equal(unknown.affordable, false, "No wallet yet: nothing is spendable");
assert.equal(unknown.label, "Need 💎3 (you have 0)");

// Freeze wins even with plenty of gems (mirrors the server).
assert.equal(repair.planRepair(offer, { streakFreezes: 1, gems: 99 }).payWith, "freeze");
// Garbage wallet values are treated as zero.
assert.equal(repair.planRepair(offer, { streakFreezes: -4, gems: Number.NaN }).affordable, false);
// A server that changes the gem price is followed.
assert.equal(repair.planRepair({ ...offer, gemCost: 5 }, { gems: 4 }).label, "Need 💎5 (you have 4)");

// ── Errors ──
assert.equal(repair.repairErrorMessage(409, "x"), "This day was just logged. We've refreshed your habit.");
assert.equal(
  repair.repairErrorMessage(400, "You need a streak freeze or 3 gems to repair this streak"),
  "You need a streak freeze or 3 gems to repair this streak",
  "Payment problems keep the server's wording"
);
assert.match(repair.repairErrorMessage(400, "This day can't be repaired"), /can't be repaired anymore/);
assert.equal(repair.repairErrorMessage(500, ""), "Couldn't repair your streak. Please try again.");

console.log("Streak repair helper checks passed");
