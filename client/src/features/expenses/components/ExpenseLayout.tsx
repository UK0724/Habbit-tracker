import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowLeft, PiggyBank, Settings } from "lucide-react";
import { useExpenseStore } from "../stores/expenseStore";
import { cn } from "../../../shared/lib/utils";

export const CATEGORIES = ["Food", "Transport", "Rent", "Entertainment", "Shopping", "Bills", "Misc"];

export const ExpenseLayout = () => {
  const { expenses, budgets, fetchExpenses, fetchBudgets, setBudgetLimit } = useExpenseStore();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]!);
  const [budgetLimitInput, setBudgetLimitInput] = useState("");

  useEffect(() => {
    fetchExpenses();
    fetchBudgets();
  }, []);

  const getMonthlyTotal = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getCategoryMonthlyTotal = (category: string) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return e.category === category && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimitInput);
    if (isNaN(limit) || limit < 0) return;
    setBudgetLimit(selectedCategory, limit);
    setBudgetLimitInput("");
    setShowSettings(false);
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      {/* Sidebar Panel */}
      <aside className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border-app bg-surface p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            to="/habits"
            className="text-xs font-bold text-content-muted hover:text-content flex items-center gap-1 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Habits
          </Link>
        </div>

        <div>
          <h2 className="text-xl font-display font-bold text-content flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-emerald-500" />
            Expense Tracker
          </h2>
          <p className="text-xs text-content-muted mt-1">Manage budgets, track spend, and view trends.</p>
        </div>

        {/* Budget Summary Card */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Spent This Month</p>
          <p className="text-3xl font-display font-extrabold text-content mt-1">
            ₹{getMonthlyTotal().toLocaleString("en-IN")}
          </p>
        </div>

        {/* Categories / Budgets section */}
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-content-2 uppercase tracking-wider">Monthly Budgets</h3>
            <button
              onClick={() => setShowSettings(true)}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <Settings className="h-3.5 w-3.5" />
              Set Limits
            </button>
          </div>

          <div className="space-y-3.5">
            {CATEGORIES.map((cat) => {
              const currentLimit = budgets.find((b) => b.category === cat)?.monthlyLimit || 0;
              const spent = getCategoryMonthlyTotal(cat);
              const percent = currentLimit > 0 ? Math.min(100, Math.round((spent / currentLimit) * 100)) : 0;
              
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-content-2">{cat}</span>
                    <span className="text-content-muted">
                      ₹{spent.toLocaleString("en-IN")} / {currentLimit > 0 ? `₹${currentLimit.toLocaleString("en-IN")}` : "No limit"}
                    </span>
                  </div>
                  {currentLimit > 0 && (
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main workspace area */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        <Outlet />
      </main>

      {/* Budget Set Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="surface-card w-full max-w-md p-6 space-y-4 animate-pop-in">
            <h3 className="text-lg font-bold text-content">Configure Category Budgets</h3>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-content-2 mb-1">Select Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl border border-border-app bg-surface px-4 py-2.5 text-sm text-content outline-none focus:border-accent"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-content-2 mb-1">Monthly Limit (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={budgetLimitInput}
                  onChange={(e) => setBudgetLimitInput(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border-app bg-surface px-4 py-2.5 text-sm text-content outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="rounded-xl border border-border-app px-4 py-2 text-xs font-bold text-content-2 hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
