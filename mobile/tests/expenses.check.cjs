const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

process.env.TZ = "Asia/Kolkata";

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

const rules = load(path.join(__dirname, "../../shared/src/lib/rules.ts"), require);
const format = load(path.join(__dirname, "../src/utils/format.ts"), (name) => {
  if (name === "@habit-tracker/shared") return rules;
  throw new Error(`Unexpected import: ${name}`);
});
const requests = [];
const expenses = load(path.join(__dirname, "../src/services/expenses.ts"), (name) => {
  if (name === "./api")
    return {
      apiRequest: async (url, init) => {
        requests.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(init.body) : undefined });
        return url.endsWith("/budgets") && !init ? null : { id: "x" };
      }
    };
  if (name === "../utils/format") return format;
  throw new Error(`Unexpected import: ${name}`);
});

// ── Months ──
assert.equal(expenses.monthOf("2026-09-28"), "2026-09");
assert.equal(expenses.shiftMonth("2026-09", -1), "2026-08");
assert.equal(expenses.shiftMonth("2026-01", -1), "2025-12", "Wraps back across years");
assert.equal(expenses.shiftMonth("2026-12", 1), "2027-01", "Wraps forward across years");
assert.deepEqual(plain(expenses.monthRange("2026-09")), { start: "2026-09-01", end: "2026-09-30", days: 30 });
assert.deepEqual(plain(expenses.monthRange("2028-02")), { start: "2028-02-01", end: "2028-02-29", days: 29 }, "Leap year");
assert.equal(expenses.monthRange("2026-02").end, "2026-02-28");
assert.equal(expenses.monthLabel("2026-09", 2026), "September");
assert.equal(expenses.monthLabel("2025-12", 2026), "December 2025");
assert.equal(expenses.monthLabel("2026-09"), "September 2026");
assert.equal(expenses.dayLabel("2026-09-28", "2026-09-28"), "Today");
assert.equal(expenses.dayLabel("2026-09-27", "2026-09-28"), "Yesterday");
assert.equal(expenses.dayLabel("2026-08-31", "2026-09-01"), "Yesterday", "Yesterday across month ends");
assert.equal(expenses.dayLabel("2026-09-21", "2026-09-28"), "Mon, Sep 21");
assert.equal(expenses.dayLabel("2025-12-31", "2026-01-05"), "Wed, Dec 31, 2025");
assert.equal(expenses.defaultExpenseDate("2026-09", "2026-09-28"), "2026-09-28", "Current month defaults to today");
assert.equal(expenses.defaultExpenseDate("2026-08", "2026-09-28"), "2026-08-31", "Past month defaults to its last day");
console.log("Expense month range and date label checks passed.");

// ── Grouping and totals ──
const list = [
  { id: "a", amount: 120.5, category: "Food", date: "2026-09-28", description: "", paymentMethod: "UPI", createdAt: "2026-09-28T08:00:00Z" },
  { id: "b", amount: 0.1, category: "Food", date: "2026-09-28", description: "Tea", paymentMethod: "Cash", createdAt: "2026-09-28T10:00:00Z" },
  { id: "c", amount: 0.2, category: "Transport", date: "2026-09-02", description: "", paymentMethod: "Card", createdAt: "2026-09-02T10:00:00Z" },
  { id: "d", amount: 15000, category: "Rent", date: "2026-09-01", description: "", paymentMethod: "UPI", createdAt: "2026-09-01T10:00:00Z" },
  { id: "e", amount: 999, category: "Shopping", date: "2026-08-31", description: "", paymentMethod: "UPI", createdAt: "2026-08-31T10:00:00Z" },
  { id: "f", amount: 50, category: "Food", date: "2026-10-01", description: "", paymentMethod: "UPI", createdAt: "2026-10-01T10:00:00Z" }
];
const september = expenses.expensesInMonth(list, "2026-09");
assert.deepEqual(plain(september.map((e) => e.id)), ["a", "b", "c", "d"], "Only the month's expenses, inclusive of both ends");
assert.equal(expenses.sumAmounts(september), 15120.8);
assert.equal(expenses.sumAmounts([{ amount: 0.1 }, { amount: 0.2 }]), 0.3, "Float sums are rounded to paise");
assert.equal(expenses.sumAmounts([]), 0);

const groups = expenses.groupByDay(september);
assert.deepEqual(plain(groups.map((g) => g.date)), ["2026-09-28", "2026-09-02", "2026-09-01"], "Newest day first");
assert.deepEqual(plain(groups[0].items.map((e) => e.id)), ["b", "a"], "Newest entry first within a day");
assert.equal(groups[0].total, 120.6);
assert.deepEqual(plain(expenses.groupByDay([])), []);

const totals = expenses.totalsByCategory(september);
assert.deepEqual(plain(totals.map((t) => t.category)), ["Rent", "Food", "Transport"], "Largest category first");
assert.equal(totals[1].total, 120.6);
assert.equal(totals[1].count, 2);
assert.ok(Math.abs(totals.reduce((sum, t) => sum + t.share, 0) - 1) < 1e-9, "Shares add up to 100%");
assert.deepEqual(plain(expenses.totalsByCategory([])), []);
assert.equal(expenses.totalsByCategory([{ id: "z", amount: 0, category: "Misc", date: "2026-09-01" }])[0].share, 0, "No NaN share when everything is 0");
console.log("Expense grouping and category total checks passed.");

// ── Budgets ──
assert.equal(expenses.budgetStatus(100, 0), null, "No limit means no budget");
assert.deepEqual(plain(expenses.budgetStatus(250, 1000)), { percent: 25, ratio: 0.25, over: false, remaining: 750 });
assert.deepEqual(plain(expenses.budgetStatus(1000, 1000)), { percent: 100, ratio: 1, over: false, remaining: 0 }, "Exactly at the limit is not over");
assert.deepEqual(plain(expenses.budgetStatus(1500, 1000)), { percent: 150, ratio: 1, over: true, remaining: -500 }, "Over budget clamps the bar");
assert.deepEqual(
  plain(expenses.activeBudgets([{ id: "1", category: "Food", monthlyLimit: 0 }, { id: "2", category: "Rent", monthlyLimit: 5 }])).map((b) => b.category),
  ["Rent"],
  "A 0 limit is a cleared budget"
);
console.log("Budget percentage and over-budget checks passed.");

// ── Amount parsing (server: finite, non-negative; app: more than 0) ──
assert.deepEqual(plain(expenses.parseAmount("250")), { value: 250, error: null });
assert.deepEqual(plain(expenses.parseAmount(" 99.50 ")), { value: 99.5, error: null });
assert.equal(expenses.parseAmount("1,5").value, 1.5, "Comma decimals");
assert.equal(expenses.parseAmount("10,000").value, 10000, "Thousands separators");
assert.equal(expenses.parseAmount("0.01").value, 0.01);
assert.equal(expenses.parseAmount("").error, "Enter an amount.");
assert.ok(expenses.parseAmount("0").error, "Zero is rejected");
assert.ok(expenses.parseAmount("-5").error, "Negatives are rejected");
assert.ok(expenses.parseAmount("abc").error);
assert.ok(expenses.parseAmount("1e3").error);
assert.ok(expenses.parseAmount("1.234").error, "At most 2 decimals");
assert.ok(expenses.parseAmount("0.0000001").error, "Sub-paise amounts are rejected");
assert.ok(expenses.parseAmount("99999999999").error, "Absurd amounts are rejected");
assert.deepEqual(plain(expenses.parseBudget("")), { value: 0, error: null }, "Blank clears a budget");
assert.equal(expenses.parseBudget("0").value, 0);
assert.equal(expenses.parseBudget("5000").value, 5000);
assert.ok(expenses.parseBudget("-1").error);
assert.ok(expenses.parseBudget("x").error);
assert.equal(expenses.amountInputText(250), "250");
assert.equal(expenses.amountInputText(99.5), "99.50");
assert.equal(expenses.amountInputText(0.1 + 0.2), "0.30");
console.log("Amount and budget parsing checks passed.");

// ── Currency formatting ──
assert.equal(expenses.formatRupees(0), "₹0");
assert.equal(expenses.formatRupees(999), "₹999");
assert.equal(expenses.formatRupees(1000), "₹1,000");
assert.equal(expenses.formatRupees(123456), "₹1,23,456");
assert.equal(expenses.formatRupees(12345678.5), "₹1,23,45,678.50");
assert.equal(expenses.formatRupees(0.1 + 0.2), "₹0.30");
assert.equal(expenses.formatRupees(-500), "-₹500");
assert.equal(expenses.formatRupees(250000, { compact: true }), "₹2.5L");
assert.equal(expenses.categoryMeta("Food").emoji, "🍕");
assert.equal(expenses.categoryMeta("Unknown").emoji, "📦", "Unknown categories fall back to Misc");
console.log("Rupee formatting checks passed.");

// ── API paths and bodies match server/src/modules/expenses ──
(async () => {
  assert.deepEqual(plain(await expenses.expenseApi.budgets()), [], "A null budget list becomes []");
  const input = { amount: 10, category: "Food", date: "2026-09-28", description: "", paymentMethod: "UPI" };
  await expenses.expenseApi.list();
  await expenses.expenseApi.create(input);
  await expenses.expenseApi.update("abc123", input);
  await expenses.expenseApi.delete("abc123");
  await expenses.expenseApi.setBudget("Food", 0);
  assert.deepEqual(
    requests.map((r) => `${r.method} ${r.url}`),
    [
      "GET /expenses/budgets",
      "GET /expenses",
      "POST /expenses",
      "PUT /expenses/abc123",
      "DELETE /expenses/abc123",
      "POST /expenses/budgets"
    ]
  );
  assert.deepEqual(requests[2].body, input);
  assert.deepEqual(requests[5].body, { category: "Food", monthlyLimit: 0 });
  assert.deepEqual(plain(expenses.expenseKeys.list()).slice(0, 1), ["expenses"], "Lists live under the expenses namespace");
  console.log("Expense API contract checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
