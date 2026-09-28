import { apiRequest, type RewardSummary } from "./api";
import { parseNumberInput } from "../utils/format";

// ── Types (server: server/src/modules/expenses) ──
export interface Expense {
  id: string;
  amount: number;
  category: string;
  /** YYYY-MM-DD */
  date: string;
  description: string;
  paymentMethod: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
}

export interface ExpenseInput {
  amount: number;
  category: string;
  date: string;
  description: string;
  paymentMethod: string;
}

/** The server does not send a reward today; tolerated if a future one does. */
export type SavedExpense = Expense & { reward?: Partial<RewardSummary> | null };

// ── Constants shared with the web app ──
export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Entertainment",
  "Shopping",
  "Bills",
  "Misc"
] as const;

export const PAYMENT_METHODS = ["UPI", "Card", "Cash"] as const;

export const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  Food: { emoji: "🍕", color: "#10B981" },
  Transport: { emoji: "🚗", color: "#3B82F6" },
  Rent: { emoji: "🏠", color: "#8B5CF6" },
  Entertainment: { emoji: "🎬", color: "#EC4899" },
  Shopping: { emoji: "🛍️", color: "#F59E0B" },
  Bills: { emoji: "💡", color: "#06B6D4" },
  Misc: { emoji: "📦", color: "#94A3B8" }
};

export const categoryMeta = (category: string) =>
  CATEGORY_META[category] ?? CATEGORY_META.Misc;

/** Server limits (expense.validation.ts). */
export const NOTE_MAX_LENGTH = 280;
export const MAX_AMOUNT = 1_000_000_000;

// ── Query keys ──
export const expenseKeys = {
  all: ["expenses"] as const,
  /** GET /expenses has no month filter, so one cached list serves every month. */
  list: () => ["expenses", "list"] as const,
  budgets: ["budgets"] as const
};

// ── API ──
export const expenseApi = {
  list: async () => (await apiRequest<Expense[]>("/expenses")) ?? [],

  create: (input: ExpenseInput) =>
    apiRequest<SavedExpense>("/expenses", {
      method: "POST",
      body: JSON.stringify(input)
    }),

  update: (id: string, input: Partial<ExpenseInput>) =>
    apiRequest<SavedExpense>(`/expenses/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input)
    }),

  delete: (id: string) =>
    apiRequest<void>(`/expenses/${encodeURIComponent(id)}`, { method: "DELETE" }),

  budgets: async () => (await apiRequest<Budget[]>("/expenses/budgets")) ?? [],

  /** Upserts; a limit of 0 clears the budget (there is no delete endpoint). */
  setBudget: (category: string, monthlyLimit: number) =>
    apiRequest<Budget>("/expenses/budgets", {
      method: "POST",
      body: JSON.stringify({ category, monthlyLimit })
    })
};

// ── Pure helpers ──
const pad = (value: number) => String(value).padStart(2, "0");
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTH_SHORT = MONTH_NAMES.map((name) => name.slice(0, 3));
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const monthParts = (month: string) => {
  const [year, value] = month.split("-").map(Number);
  return { year, month: value };
};

/** "YYYY-MM" for a YYYY-MM-DD date. */
export const monthOf = (date: string) => date.slice(0, 7);

/** Moves a "YYYY-MM" month by `delta` months. */
export const shiftMonth = (month: string, delta: number) => {
  const { year, month: value } = monthParts(month);
  const date = new Date(year, value - 1 + delta, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

/** First and last YYYY-MM-DD of a month, and its length. */
export const monthRange = (month: string) => {
  const { year, month: value } = monthParts(month);
  const days = new Date(year, value, 0).getDate();
  return { start: `${month}-01`, end: `${month}-${pad(days)}`, days };
};

/** "September 2026"; the year is dropped when `currentYear` matches. */
export const monthLabel = (month: string, currentYear?: number) => {
  const { year, month: value } = monthParts(month);
  const name = MONTH_NAMES[value - 1] ?? month;
  return year === currentYear ? name : `${name} ${year}`;
};

/** "Today", "Yesterday" or "Mon, Sep 28". */
export const dayLabel = (date: string, today: string) => {
  if (date === today) return "Today";
  const [y, m, d] = today.split("-").map(Number);
  const yesterday = new Date(y, m - 1, d - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
  if (date === yesterdayKey) return "Yesterday";
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day);
  const label = `${WEEKDAYS[value.getDay()]}, ${MONTH_SHORT[month - 1]} ${day}`;
  return year === y ? label : `${label}, ${year}`;
};

export const expensesInMonth = (expenses: Expense[], month: string) => {
  const { start, end } = monthRange(month);
  return expenses.filter((expense) => expense.date >= start && expense.date <= end);
};

export const sumAmounts = (expenses: Pick<Expense, "amount">[]) =>
  roundMoney(expenses.reduce((total, expense) => total + (Number(expense.amount) || 0), 0));

/** Rounds to paise so float sums never render as 0.30000000000000004. */
export const roundMoney = (value: number) => Math.round(value * 100) / 100;

const newestFirst = (a: Expense, b: Expense) =>
  (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || b.id.localeCompare(a.id);

/** Days newest first, each with its expenses newest first and a total. */
export const groupByDay = (expenses: Expense[]) => {
  const byDate = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const list = byDate.get(expense.date) ?? [];
    list.push(expense);
    byDate.set(expense.date, list);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      total: sumAmounts(items),
      items: [...items].sort(newestFirst)
    }));
};

/** Spending per category, largest first, with each share of the total (0–1). */
export const totalsByCategory = (expenses: Expense[]) => {
  const totals = new Map<string, { total: number; count: number }>();
  for (const expense of expenses) {
    const entry = totals.get(expense.category) ?? { total: 0, count: 0 };
    entry.total += Number(expense.amount) || 0;
    entry.count += 1;
    totals.set(expense.category, entry);
  }
  const grand = sumAmounts(expenses);
  return [...totals.entries()]
    .map(([category, { total, count }]) => ({
      category,
      total: roundMoney(total),
      count,
      share: grand > 0 ? total / grand : 0
    }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
};

/** Progress against a limit. `ratio` is clamped to 0–1 for drawing bars. */
export const budgetStatus = (spent: number, limit: number) => {
  if (!(limit > 0)) return null;
  const raw = spent / limit;
  return {
    percent: Math.round(raw * 100),
    ratio: Math.min(1, Math.max(0, raw)),
    over: spent > limit,
    remaining: roundMoney(limit - spent)
  };
};

/** Only budgets with a positive limit count; 0 means "cleared". */
export const activeBudgets = (budgets: Budget[]) =>
  budgets.filter((budget) => Number(budget.monthlyLimit) > 0);

type Parsed = { value: number; error: null } | { value: null; error: string };

/** True when a value has more precision than paise. */
const hasSubPaise = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) > 1e-6;

/** Expense amount: required, more than 0, at most 2 decimal places. */
export const parseAmount = (raw: string): Parsed => {
  if (!raw.trim()) return { value: null, error: "Enter an amount." };
  const value = parseNumberInput(raw);
  if (value === null) return { value: null, error: "Enter a number, like 250 or 99.50." };
  if (value <= 0) return { value: null, error: "Amount must be more than ₹0." };
  if (hasSubPaise(value)) return { value: null, error: "Use at most 2 decimal places." };
  if (value > MAX_AMOUNT) return { value: null, error: "That amount looks too large." };
  return { value, error: null };
};

/** Budget limit: blank or 0 clears it; otherwise a positive amount. */
export const parseBudget = (raw: string): Parsed => {
  if (!raw.trim()) return { value: 0, error: null };
  const value = parseNumberInput(raw);
  if (value === null) return { value: null, error: "Enter a number or leave blank." };
  if (value < 0) return { value: null, error: "A budget can't be negative." };
  if (hasSubPaise(value)) return { value: null, error: "Use at most 2 decimal places." };
  if (value > MAX_AMOUNT) return { value: null, error: "That amount looks too large." };
  return { value, error: null };
};

/** Indian digit grouping: 1234567.5 -> "12,34,567.50". */
const groupIndian = (integer: string) => {
  if (integer.length <= 3) return integer;
  const last = integer.slice(-3);
  const rest = integer.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last}`;
};

/** "₹1,23,456" or "₹99.50"; no Intl dependency (Hermes-safe). */
export const formatRupees = (amount: number, options: { compact?: boolean } = {}) => {
  const value = roundMoney(Number(amount) || 0);
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (options.compact && abs >= 100000) {
    const lakhs = abs / 100000;
    const text = abs >= 10000000 ? `${roundTo(abs / 10000000, 1)}Cr` : `${roundTo(lakhs, 1)}L`;
    return `${sign}₹${text}`;
  }
  const [integer, fraction] = abs.toFixed(2).split(".");
  const grouped = groupIndian(integer);
  return `${sign}₹${fraction === "00" ? grouped : `${grouped}.${fraction}`}`;
};

const roundTo = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return String(Math.round(value * factor) / factor);
};

/** Text to prefill the amount field when editing (no grouping commas). */
export const amountInputText = (amount: number) => {
  const value = roundMoney(amount);
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

/** Default date for a new expense while viewing `month`. */
export const defaultExpenseDate = (month: string, today: string) =>
  monthOf(today) === month ? today : monthRange(month).end < today ? monthRange(month).end : today;
