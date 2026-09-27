// Runnable check for the validation schemas and the expense id transform.
// No DB connection needed. Run: npm run check --workspace server
import assert from "node:assert/strict";
import { ACHIEVEMENTS } from "./modules/gamification/gamification.constants.js";

// Native clients render this API field directly; an omitted icon leaves a blank badge.
assert.equal(new Set(ACHIEVEMENTS.map((badge) => badge.id)).size, ACHIEVEMENTS.length);
for (const badge of ACHIEVEMENTS) {
  assert.ok(badge.emoji?.trim(), `Achievement ${badge.id} needs an icon`);
}

import { ExpenseModel } from "./modules/expenses/expense.model.js";
import {
  createExpenseBodySchema,
  updateExpenseBodySchema
} from "./modules/expenses/expense.validation.js";
import { markSolvedBodySchema } from "./modules/dsaPrep/dsaPrep.validation.js";
import { updateProfileBodySchema } from "./modules/jobTracker/jobTracker.validation.js";

// Expenses serialize as `id`, not `_id` -- the client keys edit/delete off it.
const serialized = new ExpenseModel({
  userId: "u1",
  amount: 100,
  category: "Food",
  date: "2026-08-10",
  paymentMethod: "UPI"
}).toJSON() as Record<string, unknown>;

assert.equal(typeof serialized.id, "string");
assert.ok(!("_id" in serialized), "_id should be stripped from JSON output");

// Expense bodies are validated, not trusted.
assert.throws(() => createExpenseBodySchema.parse({ amount: "abc" }));
assert.throws(() =>
  createExpenseBodySchema.parse({
    amount: 10,
    category: "Food",
    date: "not-a-date",
    paymentMethod: "UPI"
  })
);
assert.throws(() => updateExpenseBodySchema.parse({}), /At least one field/);
assert.equal(
  createExpenseBodySchema.parse({
    amount: "10.5",
    category: " Food ",
    date: "2026-08-10",
    paymentMethod: "UPI"
  }).amount,
  10.5
);

// DSA solve requires a real problem id and language.
assert.throws(() => markSolvedBodySchema.parse({ problemId: 1 }));
assert.throws(() =>
  markSolvedBodySchema.parse({ problemId: -1, language: "ts" })
);

// The job tracker body is $set straight onto the document, so unknown keys
// must be rejected rather than silently written.
assert.throws(
  () => updateProfileBodySchema.parse({ streak: 3, isAdmin: true }),
  /Unrecognized key/
);
assert.deepEqual(updateProfileBodySchema.parse({ streak: 3 }), { streak: 3 });

console.log("checks passed");
