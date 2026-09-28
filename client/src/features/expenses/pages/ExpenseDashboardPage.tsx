import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Wallet,
  TrendingDown,
  PiggyBank,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

import { useQueryClient } from "@tanstack/react-query";
import { useExpenseStore, Expense } from "../stores/expenseStore";
import { applyReward } from "../../gamification/rewards";
import { CATEGORIES, CATEGORY_CONFIG } from "../categories";
import { useDialog } from "../../../shared/hooks/useDialog";
import { getTodayDateString } from "../../../shared/lib/date";
import { cn } from "../../../shared/lib/utils";

const CHART_COLORS = [
  "#10b981", // Food (emerald)
  "#3b82f6", // Transport (blue)
  "#8b5cf6", // Rent (violet)
  "#ec4899", // Entertainment (pink)
  "#f59e0b", // Shopping (amber)
  "#06b6d4", // Bills (cyan)
  "#64748b" // Misc (slate)
];

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

export const ExpenseDashboardPage = () => {
  const {
    expenses,
    budgets,
    error: storeError,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    setBudgetLimit,
    fetchExpenses,
    fetchBudgets,
    clearError
  } = useExpenseStore();
  const queryClient = useQueryClient();
  const [listError, setListError] = useState("");
  const [budgetError, setBudgetError] = useState("");

  /** Expenses can auto-complete a linked habit (and award XP). */
  const refreshLinkedData = () => {
    void queryClient.invalidateQueries({ queryKey: ["habits"] });
    void queryClient.invalidateQueries({ queryKey: ["habit"] });
    void queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
    void queryClient.invalidateQueries({ queryKey: ["insights"] });
    void queryClient.invalidateQueries({ queryKey: ["gamification"] });
  };

  const handleDelete = async (exp: Expense) => {
    if (
      !window.confirm(
        `Delete this ₹${exp.amount.toLocaleString("en-IN")} ${exp.category} expense? This can't be undone.`
      )
    ) {
      return;
    }
    setListError("");
    try {
      await deleteExpense(exp.id);
      clearError();
      refreshLinkedData();
    } catch (err) {
      clearError();
      setListError(
        err instanceof Error
          ? `Could not delete the expense: ${err.message}`
          : "Could not delete the expense. Please try again."
      );
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Selected Month state (YYYY-MM)
  const todayStr = getTodayDateString();
  const currentMonthStr = todayStr.slice(0, 7);
  const [month, setMonth] = useState(currentMonthStr);

  const defaultCategory = CATEGORIES[0] || "Food";

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const savingRef = useRef(false);
  const closeModal = useCallback(() => {
    if (!savingRef.current) setShowModal(false);
  }, []);
  useDialog(showModal, closeModal, "[data-expense-dialog]");

  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<string>(defaultCategory);
  const [dateInput, setDateInput] = useState(todayStr);
  const [descriptionInput, setDescriptionInput] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState("UPI");

  // Budget Settings Modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedBudgetCat, setSelectedBudgetCat] =
    useState<string>(defaultCategory);
  const [budgetLimitInput, setBudgetLimitInput] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);
  const closeBudgetModal = useCallback(() => setShowBudgetModal(false), []);
  useDialog(showBudgetModal, closeBudgetModal, "[data-budget-dialog]");

  // Month navigation helpers
  const shiftMonth = (delta: number) => {
    const parts = month.split("-");
    const y = Number(parts[0]) || new Date().getFullYear();
    const m = Number(parts[1]) || new Date().getMonth() + 1;
    const date = new Date(y, m - 1 + delta, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, "0");
    setMonth(`${newY}-${newM}`);
  };

  const monthName = (() => {
    const parts = month.split("-");
    const y = Number(parts[0]) || new Date().getFullYear();
    const m = Number(parts[1]) || new Date().getMonth() + 1;
    const d = new Date(y, m - 1, 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  })();

  // Filter expenses by selected month
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(month));

  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const parts = month.split("-");
  const y = Number(parts[0]) || new Date().getFullYear();
  const m = Number(parts[1]) || new Date().getMonth() + 1;
  const daysInSelectedMonth = new Date(y, m, 0).getDate();
  const dayOfMonth =
    month === currentMonthStr ? Number(todayStr.slice(8)) : daysInSelectedMonth;
  const dailyAverage = totalSpent / (dayOfMonth || 1);

  // Total budget calculation
  const totalBudgetLimit = budgets.reduce(
    (sum, b) => sum + (b.monthlyLimit || 0),
    0
  );
  const budgetRemaining =
    totalBudgetLimit > 0 ? Math.max(0, totalBudgetLimit - totalSpent) : 0;
  const budgetPercentage =
    totalBudgetLimit > 0
      ? Math.min(100, Math.round((totalSpent / totalBudgetLimit) * 100))
      : 0;

  const handleOpenAdd = () => {
    setEditExpense(null);
    setAmountInput("");
    setCategoryInput(defaultCategory);
    setDateInput(month === currentMonthStr ? todayStr : `${month}-01`);
    setDescriptionInput("");
    setPaymentMethodInput("UPI");
    setSaveError("");
    setShowModal(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditExpense(exp);
    setAmountInput(exp.amount.toString());
    setCategoryInput(exp.category);
    setDateInput(exp.date);
    setDescriptionInput(exp.description);
    setPaymentMethodInput(exp.paymentMethod);
    setSaveError("");
    setShowModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount < 0.01) {
      setSaveError("Enter an amount of at least ₹0.01.");
      return;
    }

    const payload = {
      amount,
      category: categoryInput,
      date: dateInput,
      description: descriptionInput || categoryInput,
      paymentMethod: paymentMethodInput
    };

    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      if (editExpense) {
        await updateExpense(editExpense.id, payload);
      } else {
        const saved = await addExpense(payload);
        applyReward(queryClient, saved?.reward, { title: "Habit completed!" });
      }
      clearError();
      refreshLinkedData();
      setShowModal(false);
    } catch (err) {
      clearError();
      setSaveError(
        err instanceof Error ? err.message : "Could not save. Try again."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleOpenBudgetModal = (category?: string) => {
    const targetCat = category || defaultCategory;
    setSelectedBudgetCat(targetCat);
    const existing = budgets.find((b) => b.category === targetCat);
    setBudgetLimitInput(
      existing?.monthlyLimit ? String(existing.monthlyLimit) : ""
    );
    setBudgetError("");
    setShowBudgetModal(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimitInput);
    if (isNaN(limit) || limit < 0) {
      setBudgetError("Enter 0 or a positive amount.");
      return;
    }
    setBudgetSaving(true);
    setBudgetError("");
    try {
      await setBudgetLimit(selectedBudgetCat, limit);
      clearError();
      setShowBudgetModal(false);
    } catch (err) {
      clearError();
      setBudgetError(
        err instanceof Error ? err.message : "Could not save the limit. Try again."
      );
    } finally {
      setBudgetSaving(false);
    }
  };

  // Recharts Trends
  const getLineData = () => {
    const dayTotals: { [key: number]: number } = {};
    for (let i = 1; i <= daysInSelectedMonth; i++) dayTotals[i] = 0;

    monthlyExpenses.forEach((e) => {
      const day = Number(e.date.slice(8));
      if (dayTotals[day] !== undefined) dayTotals[day] += e.amount;
    });

    return Object.keys(dayTotals).map((dayStr) => {
      const dayNum = parseInt(dayStr);
      return {
        name: `${dayNum}`,
        amount: dayTotals[dayNum] ?? 0
      };
    });
  };

  const getPieData = () => {
    const totals: { [key: string]: number } = {};
    monthlyExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.keys(totals)
      .filter((cat) => (totals[cat] ?? 0) > 0)
      .map((cat) => ({
        name: cat,
        value: totals[cat] ?? 0
      }));
  };

  // Filtered transactions for current month
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || e.category === categoryFilter;
    return matchesSearch && matchesCategory && e.date.startsWith(month);
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-app pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
              <Sparkles className="h-3 w-3" />
              Expense Tracker
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-content flex items-center gap-2.5">
            <TrendingDown className="h-7 w-7 text-emerald-500" />
            Spending Dashboard
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-content-muted">
            Visualize your expenses, manage category budgets, and monitor cash
            flow habits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Navigator */}
          <div className="flex items-center rounded-2xl border border-border-app bg-surface-2 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous Month"
              className="rounded-xl p-2 text-content-muted hover:bg-surface hover:text-content transition"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 text-xs sm:text-sm font-bold text-content min-w-[125px] text-center">
              {monthName}
            </span>

            <button
              type="button"
              onClick={() => shiftMonth(1)}
              disabled={month >= currentMonthStr}
              aria-label="Next Month"
              className="rounded-xl p-2 text-content-muted hover:bg-surface hover:text-content transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>

            {month !== currentMonthStr && (
              <button
                type="button"
                onClick={() => setMonth(currentMonthStr)}
                className="ml-1 rounded-xl bg-surface px-2.5 py-1 text-[11px] font-bold text-accent hover:bg-accent/10 transition"
              >
                This month
              </button>
            )}
          </div>

          {/* Add Expense Trigger */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition active:scale-95 hover:brightness-105 cursor-pointer"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </header>

      {(storeError || listError) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} aria-hidden />
            {listError ||
              `Could not load your expenses: ${storeError ?? "unknown error"}`}
          </span>
          {storeError && !listError ? (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                void fetchExpenses();
                void fetchBudgets();
              }}
              className="min-h-10 rounded-xl border border-rose-500/40 px-3 text-xs font-bold hover:bg-rose-500/10 disabled:opacity-50"
            >
              {isLoading ? "Retrying…" : "Retry"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setListError("")}
              className="min-h-10 rounded-xl px-3 text-xs font-bold hover:bg-rose-500/10"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Spent */}
        <div className="surface-card relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-surface to-surface p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-500">
              Total Spent
            </span>
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:flex bg-emerald-500/15 text-emerald-500">
              <Wallet size={16} />
            </div>
          </div>
          <p className="mt-2 break-words text-2xl sm:text-3xl font-display font-extrabold text-content">
            ₹{totalSpent.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-content-muted font-medium">
            {totalBudgetLimit > 0
              ? `${budgetPercentage}% of ₹${totalBudgetLimit.toLocaleString("en-IN")} budget`
              : "No overall budget set"}
          </p>
        </div>

        {/* Card 2: Remaining Budget */}
        <div className="surface-card relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-surface to-surface p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-500">
              Budget Remaining
            </span>
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:flex bg-violet-500/15 text-violet-500">
              <PiggyBank size={16} />
            </div>
          </div>
          <p className="mt-2 break-words text-2xl sm:text-3xl font-display font-extrabold text-content">
            {totalBudgetLimit > 0
              ? `₹${budgetRemaining.toLocaleString("en-IN")}`
              : "Flexible"}
          </p>
          <button
            type="button"
            onClick={() => handleOpenBudgetModal()}
            className="mt-1 flex items-center gap-1 text-[11px] font-bold text-accent hover:underline cursor-pointer"
          >
            <Settings size={12} />
            <span>Configure limits</span>
          </button>
        </div>

        {/* Card 3: Daily Average */}
        <div className="surface-card relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-surface to-surface p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-500">
              Daily Average
            </span>
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:flex bg-blue-500/15 text-blue-500">
              <Calendar size={16} />
            </div>
          </div>
          <p className="mt-2 break-words text-2xl sm:text-3xl font-display font-extrabold text-content">
            ₹{Math.round(dailyAverage).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-content-muted font-medium">
            Over {dayOfMonth} {dayOfMonth === 1 ? "day" : "days"} logged
          </p>
        </div>

        {/* Card 4: Active Records */}
        <div className="surface-card relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-surface to-surface p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500">
              Transactions
            </span>
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:flex bg-amber-500/15 text-amber-500">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="mt-2 break-words text-2xl sm:text-3xl font-display font-extrabold text-content">
            {monthlyExpenses.length} Records
          </p>
          <p className="mt-1 text-[11px] text-content-muted font-medium">
            In {monthName}
          </p>
        </div>
      </section>

      {/* Main Content: Split into Analytics & Budgets on desktop */}
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Charts & Transactions */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Spending Trend Chart */}
          {monthlyExpenses.length > 0 ? (
            <div className="surface-card min-w-0 rounded-3xl border border-border-app p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-content flex items-center gap-2">
                    <TrendingDown size={16} className="text-emerald-500" />
                    Daily Spending Velocity
                  </h3>
                  <p className="text-xs text-content-muted">
                    Day-by-day expenditure pattern for {monthName}
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                  Peak: ₹
                  {Math.max(
                    ...getLineData().map((d) => d.amount),
                    0
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={getLineData()}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorSpend"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [
                        val != null
                          ? `₹${Number(val).toLocaleString("en-IN")}`
                          : "₹0",
                        "Spent"
                      ]}
                      labelFormatter={(label) => `Day ${label}`}
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "14px",
                        color: "#fff",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorSpend)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="surface-card min-w-0 rounded-3xl border border-dashed border-border-app p-8 text-center space-y-4 shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Wallet size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-content">
                  No expenses recorded for {monthName}
                </h3>
                <p className="mt-1 text-xs text-content-muted max-w-sm mx-auto">
                  Log your daily purchases, groceries, transport, or bills to
                  generate automatic spend trends and insights.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-md shadow-accent/20 hover:bg-accent-hover transition cursor-pointer"
              >
                <Plus size={14} />
                Log First Expense
              </button>
            </div>
          )}

          {/* Recent Transactions Section */}
          <section className="surface-card min-w-0 rounded-3xl border border-border-app p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-content">
                  Recent Transactions
                </h3>
                <p className="text-xs text-content-muted">
                  Showing entries for {monthName}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full min-w-0 sm:w-64">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
                />
                <input
                  type="search"
                  aria-label="Search expenses"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-border-app bg-surface-2 pl-9 pr-3 py-1.5 text-xs text-content placeholder:text-content-muted outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setCategoryFilter("All")}
                className={cn(
                  "rounded-xl px-3 py-1 text-xs font-bold transition shrink-0 cursor-pointer",
                  categoryFilter === "All"
                    ? "bg-accent text-white shadow-sm shadow-accent/20"
                    : "bg-surface-2 text-content-muted hover:text-content hover:bg-surface-3"
                )}
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => {
                const isSelected = categoryFilter === cat;
                const meta = CATEGORY_CONFIG[cat] ?? {
                  emoji: "📦",
                  color: "text-slate-400",
                  bg: "bg-slate-500/10",
                  border: "border-slate-500/20"
                };
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold transition shrink-0 cursor-pointer",
                      isSelected
                        ? "bg-accent text-white shadow-sm shadow-accent/20"
                        : "bg-surface-2 text-content-muted hover:text-content hover:bg-surface-3"
                    )}
                  >
                    <span>{meta.emoji}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            {/* Transactions List */}
            {/* Mobile: Card list */}
            <div className="sm:hidden divide-y divide-border-app/50">
              {filteredExpenses.map((exp) => {
                const meta = CATEGORY_CONFIG[exp.category] ?? {
                  emoji: "📦",
                  color: "text-slate-400",
                  bg: "bg-slate-500/10",
                  border: "border-slate-500/20"
                };
                return (
                  <div key={exp.id} className="flex items-center gap-3 py-3">
                    {/* Category emoji circle */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg ${meta.bg}`}
                    >
                      {meta.emoji}
                    </div>

                    {/* Description + date */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-content">
                        {exp.description || exp.category}
                      </p>
                      <p className="text-[11px] text-content-muted">
                        {exp.date} ·{" "}
                        <span className="rounded bg-surface-3 px-1 py-0.5 font-bold text-content-2">
                          {exp.paymentMethod || "UPI"}
                        </span>
                      </p>
                    </div>

                    {/* Amount + actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="font-display text-sm font-bold text-content">
                        ₹{exp.amount.toLocaleString("en-IN")}
                      </span>
                      <button
                        type="button"
                        aria-label={`Edit ${exp.description || exp.category} expense`}
                        onClick={() => handleOpenEdit(exp)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-content-muted hover:bg-surface-3 hover:text-content transition"
                      >
                        <Edit2 size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${exp.description || exp.category} expense`}
                        onClick={() => void handleDelete(exp)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-content-muted hover:bg-rose-500/10 hover:text-rose-600 transition"
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-app text-[11px] font-bold uppercase tracking-wider text-content-muted">
                    <th className="pb-3 pl-2">Category</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-app/50">
                  {filteredExpenses.map((exp) => {
                    const meta = CATEGORY_CONFIG[exp.category] ?? {
                      emoji: "📦",
                      color: "text-slate-400",
                      bg: "bg-slate-500/10",
                      border: "border-slate-500/20"
                    };
                    return (
                      <tr
                        key={exp.id}
                        className="group hover:bg-surface-2/60 transition"
                      >
                        <td className="py-3 pl-2">
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-border-app bg-surface-2 px-2.5 py-1 font-bold text-content">
                            <span>{meta.emoji}</span>
                            <span>{exp.category}</span>
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-content max-w-[180px] truncate">
                          {exp.description || exp.category}
                        </td>
                        <td className="py-3 text-content-muted whitespace-nowrap">
                          {exp.date}
                        </td>
                        <td className="py-3">
                          <span className="rounded-lg bg-surface-3 px-2 py-0.5 text-[10px] font-bold text-content-2">
                            {exp.paymentMethod || "UPI"}
                          </span>
                        </td>
                        <td className="py-3 text-right font-display font-bold text-content text-sm whitespace-nowrap">
                          ₹{exp.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 pr-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              aria-label={`Edit ${exp.description || exp.category} expense`}
                              onClick={() => handleOpenEdit(exp)}
                              className="flex h-10 w-10 items-center justify-center rounded-lg text-content-muted hover:bg-surface-3 hover:text-content transition"
                            >
                              <Edit2 size={16} aria-hidden />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${exp.description || exp.category} expense`}
                              onClick={() => void handleDelete(exp)}
                              className="flex h-10 w-10 items-center justify-center rounded-lg text-content-muted hover:bg-rose-500/10 hover:text-rose-600 transition"
                            >
                              <Trash2 size={16} aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredExpenses.length === 0 && (
              <div className="py-8 text-center text-xs text-content-muted">
                <AlertCircle size={20} className="mx-auto mb-2 opacity-40" />
                No transactions match the active search or category filters.
              </div>
            )}
          </section>
        </div>

        {/* Right 1 Column: Category Budgets & Donut Share */}
        <div className="min-w-0 space-y-6">
          {/* Monthly Budgets Panel */}
          <div className="surface-card min-w-0 rounded-3xl border border-border-app p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-app pb-3">
              <div>
                <h3 className="text-sm font-bold text-content flex items-center gap-2">
                  <PiggyBank size={16} className="text-emerald-500" />
                  Monthly Budgets
                </h3>
                <p className="text-[11px] text-content-muted">
                  Set caps to keep your spending in check
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBudgetModal()}
                className="flex items-center gap-1 rounded-xl bg-surface-2 px-2.5 py-1 text-xs font-bold text-accent hover:bg-accent/10 transition cursor-pointer"
              >
                <Settings size={13} />
                <span>Set Limits</span>
              </button>
            </div>

            <div className="space-y-4">
              {CATEGORIES.map((cat) => {
                const currentLimit =
                  budgets.find((b) => b.category === cat)?.monthlyLimit || 0;
                const spent = monthlyExpenses
                  .filter((e) => e.category === cat)
                  .reduce((sum, e) => sum + e.amount, 0);
                const percent =
                  currentLimit > 0
                    ? Math.min(100, Math.round((spent / currentLimit) * 100))
                    : 0;
                const isOver = currentLimit > 0 && spent > currentLimit;
                const meta = CATEGORY_CONFIG[cat] ?? {
                  emoji: "📦",
                  color: "text-slate-400",
                  bg: "bg-slate-500/10",
                  border: "border-slate-500/20"
                };

                return (
                  <div
                    key={cat}
                    onClick={() => handleOpenBudgetModal(cat)}
                    className="group rounded-2xl border border-border-app bg-surface-2/60 p-3 hover:border-accent/40 hover:bg-surface-2 transition cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="font-bold text-content">{cat}</span>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            "font-bold",
                            isOver ? "text-rose-500" : "text-content"
                          )}
                        >
                          ₹{spent.toLocaleString("en-IN")}
                        </span>
                        <span className="text-content-muted text-[11px]">
                          {" "}
                          /{" "}
                          {currentLimit > 0
                            ? `₹${currentLimit.toLocaleString("en-IN")}`
                            : "No limit"}
                        </span>
                      </div>
                    </div>

                    {currentLimit > 0 && (
                      <div className="mt-2.5">
                        <div className="h-2 w-full rounded-full bg-surface-3 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              percent >= 90
                                ? "bg-rose-500"
                                : percent >= 75
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-content-muted font-medium">
                          <span>{percent}% used</span>
                          <span>
                            {isOver
                              ? `Exceeded by ₹${(spent - currentLimit).toLocaleString("en-IN")}`
                              : `₹${(currentLimit - spent).toLocaleString("en-IN")} left`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Share Donut Chart */}
          {getPieData().length > 0 && (
            <div className="surface-card min-w-0 rounded-3xl border border-border-app p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-content">
                Category Breakdown
              </h3>
              <div className="h-52 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {getPieData().map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [
                        val != null
                          ? `₹${Number(val).toLocaleString("en-IN")}`
                          : "₹0",
                        "Spent"
                      ]}
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "14px",
                        color: "#fff",
                        fontSize: "12px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend chips */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-app">
                {getPieData().map((item, idx) => {
                  const share =
                    totalSpent > 0
                      ? Math.round((item.value / totalSpent) * 100)
                      : 0;
                  const meta = CATEGORY_CONFIG[item.name] ?? {
                    emoji: "📦",
                    color: "text-slate-400",
                    bg: "bg-slate-500/10",
                    border: "border-slate-500/20"
                  };
                  return (
                    <div
                      key={item.name}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            CHART_COLORS[idx % CHART_COLORS.length]
                        }}
                      />
                      <span className="truncate text-content-2">
                        {meta.emoji} {item.name}
                      </span>
                      <span className="ml-auto font-bold text-content-muted">
                        {share}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Transaction Modal (Portal) */}
      {showModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/65 backdrop-blur-md animate-fade-in"
            onClick={closeModal}
          >
            <div
              data-expense-dialog
              role="dialog"
              aria-modal="true"
              aria-label="Expense"
              className="surface-card my-auto max-h-[92vh] w-full max-w-lg overflow-y-auto p-6 sm:p-7 space-y-5 rounded-3xl border border-border-app shadow-2xl animate-pop-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-border-app pb-4">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
                    <Wallet className="h-3 w-3" />
                    Transaction
                  </span>
                  <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-content">
                    {editExpense
                      ? "Edit Transaction Record"
                      : "Log New Expense"}
                  </h3>
                  <p className="mt-0.5 text-xs text-content-muted">
                    Quickly add an expense to update your live budget and
                    tracking stats.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={closeModal}
                  className="rounded-xl p-2 text-content-muted hover:bg-surface-2 hover:text-content transition"
                >
                  <X size={20} />
                </button>
              </div>

              {saveError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-600"
                >
                  {saveError}
                </div>
              )}

              <form onSubmit={handleSaveExpense} className="space-y-4">
                {/* Amount with Quick Pills */}
                <div>
                  <label
                    htmlFor="expense-amount"
                    className="block text-xs font-bold text-content-2 mb-1.5"
                  >
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-extrabold text-content-muted">
                      ₹
                    </span>
                    <input
                      id="expense-amount"
                      type="number"
                      inputMode="decimal"
                      placeholder="e.g. 250"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      required
                      step="0.01"
                      min="0.01"
                      className="w-full rounded-2xl border border-border-app bg-surface pl-9 pr-4 py-3 text-lg font-bold text-content outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                    />
                  </div>

                  {/* Quick Increment Pills */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {QUICK_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const current = parseFloat(amountInput) || 0;
                          setAmountInput(String(current + amt));
                        }}
                        className="rounded-xl border border-border-app bg-surface-2 px-2.5 py-1 text-xs font-bold text-content-2 hover:border-accent hover:text-accent transition cursor-pointer"
                      >
                        +₹{amt}
                      </button>
                    ))}
                    {amountInput && (
                      <button
                        type="button"
                        onClick={() => setAmountInput("")}
                        className="rounded-xl border border-border-app bg-surface-2 px-2.5 py-1 text-xs font-bold text-rose-400 hover:border-rose-400 transition cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Selection Grid */}
                <div>
                  <p
                    id="expense-category-label"
                    className="block text-xs font-bold text-content-2 mb-1.5"
                  >
                    Category
                  </p>
                  <div
                    role="group"
                    aria-labelledby="expense-category-label"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                  >
                    {CATEGORIES.map((cat) => {
                      const isSelected = categoryInput === cat;
                      const meta = CATEGORY_CONFIG[cat] ?? {
                        emoji: "📦",
                        color: "text-slate-400",
                        bg: "bg-slate-500/10",
                        border: "border-slate-500/20"
                      };
                      return (
                        <button
                          key={cat}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setCategoryInput(cat)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-2xl border p-2.5 text-xs font-bold transition cursor-pointer",
                            isSelected
                              ? "border-accent bg-accent/15 text-accent ring-1 ring-accent"
                              : "border-border-app bg-surface hover:border-content-subtle text-content-2"
                          )}
                        >
                          <span className="text-base">{meta.emoji}</span>
                          <span>{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date & Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="expense-date"
                      className="block text-xs font-bold text-content-2 mb-1.5"
                    >
                      Date
                    </label>
                    <input
                      id="expense-date"
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      required
                      max={todayStr}
                      className="w-full rounded-2xl border border-border-app bg-surface px-4 py-2.5 text-sm text-content outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                    />
                  </div>

                  <div>
                    <p
                      id="expense-payment-label"
                      className="block text-xs font-bold text-content-2 mb-1.5"
                    >
                      Payment Method
                    </p>
                    <div
                      role="group"
                      aria-labelledby="expense-payment-label"
                      className="grid grid-cols-3 gap-1.5"
                    >
                      {["UPI", "Card", "Cash"].map((method) => {
                        const isSelected = paymentMethodInput === method;
                        return (
                          <button
                            key={method}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setPaymentMethodInput(method)}
                            className={cn(
                              "rounded-xl border py-2 text-xs font-bold transition text-center cursor-pointer",
                              isSelected
                                ? "border-accent bg-accent text-white shadow-sm shadow-accent/20"
                                : "border-border-app bg-surface text-content-muted hover:text-content hover:bg-surface-2"
                            )}
                          >
                            {method}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="expense-description"
                    className="block text-xs font-bold text-content-2 mb-1.5"
                  >
                    Description / Merchant (Optional)
                  </label>
                  <input
                    id="expense-description"
                    type="text"
                    placeholder="e.g. Groceries at supermarket, Uber to office..."
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="w-full rounded-2xl border border-border-app bg-surface px-4 py-2.5 text-sm text-content outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2.5 border-t border-border-app pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-2xl border border-border-app px-4 py-2.5 text-xs font-bold text-content-2 hover:bg-surface-2 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:brightness-105 transition cursor-pointer"
                  >
                    {saving
                      ? "Saving…"
                      : editExpense
                        ? "Update Expense"
                        : "Save Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Configure Budgets Modal (Portal) */}
      {showBudgetModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/65 backdrop-blur-md animate-fade-in"
            onClick={closeBudgetModal}
          >
            <div
              data-budget-dialog
              role="dialog"
              aria-modal="true"
              aria-label="Set Budget Limits"
              className="surface-card my-auto max-h-[90vh] w-full max-w-md overflow-y-auto p-6 sm:p-7 space-y-5 rounded-3xl border border-border-app shadow-2xl animate-pop-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-border-app pb-4">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-bold text-violet-500">
                    <PiggyBank className="h-3 w-3" />
                    Limits
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold text-content">
                    Configure Category Budget
                  </h3>
                  <p className="mt-0.5 text-xs text-content-muted">
                    Set a monthly threshold to receive visual alerts and track
                    limits.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={closeBudgetModal}
                  className="rounded-xl p-2 text-content-muted hover:bg-surface-2 hover:text-content transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-4">
                <div>
                  <label
                    htmlFor="budget-category"
                    className="block text-xs font-bold text-content-2 mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="budget-category"
                    value={selectedBudgetCat}
                    onChange={(e) => {
                      setSelectedBudgetCat(e.target.value);
                      const existing = budgets.find(
                        (b) => b.category === e.target.value
                      );
                      setBudgetLimitInput(
                        existing?.monthlyLimit
                          ? String(existing.monthlyLimit)
                          : ""
                      );
                    }}
                    className="w-full rounded-2xl border border-border-app bg-surface px-4 py-2.5 text-sm text-content outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_CONFIG[c]?.emoji} {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="budget-limit"
                    className="block text-xs font-bold text-content-2 mb-1.5"
                  >
                    Monthly Limit (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-extrabold text-content-muted">
                      ₹
                    </span>
                    <input
                      id="budget-limit"
                      type="number"
                      inputMode="decimal"
                      placeholder="e.g. 5000 (0 for no limit)"
                      value={budgetLimitInput}
                      onChange={(e) => setBudgetLimitInput(e.target.value)}
                      required
                      min="0"
                      step="any"
                      className="w-full rounded-2xl border border-border-app bg-surface pl-9 pr-4 py-2.5 text-sm font-bold text-content outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-content-muted">
                    Set to 0 if you want to remove the limit for this category.
                  </p>
                </div>

                {budgetError ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600"
                  >
                    {budgetError}
                  </p>
                ) : null}

                <div className="flex items-center justify-end gap-2.5 border-t border-border-app pt-4">
                  <button
                    type="button"
                    onClick={closeBudgetModal}
                    className="rounded-2xl border border-border-app px-4 py-2 text-xs font-bold text-content-2 hover:bg-surface-2 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={budgetSaving}
                    className="rounded-2xl bg-accent px-5 py-2 text-xs font-bold text-white shadow-md shadow-accent/20 hover:bg-accent-hover transition cursor-pointer"
                  >
                    {budgetSaving ? "Saving…" : "Save Limit"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
