import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Trash2, Edit, Calendar, CreditCard, Wallet, TrendingDown } from "lucide-react";
import { useExpenseStore, Expense } from "../stores/expenseStore";
import { CATEGORIES } from "../components/ExpenseLayout";
import { useHabits } from "../../habits/hooks/useHabits";
import { useSaveHabitLog } from "../../logs/hooks/useHabitLogs";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#64748b"];

export const ExpenseDashboardPage = () => {
  const { expenses, fetchExpenses, addExpense, updateExpense, deleteExpense } = useExpenseStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  // Add/Edit Modal states
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<string>(CATEGORIES[0]!);
  const [dateInput, setDateInput] = useState(new Date().toISOString().split("T")[0] || "");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState("UPI");

  const todayStr = new Date().toISOString().split("T")[0] || "";
  const { data: habits } = useHabits(todayStr);
  const saveLogMutation = useSaveHabitLog();

  // Habit Sync observer
  useEffect(() => {
    if (!habits || !expenses) return;
    const expenseHabit = habits.find((h) => h.linkToExpenseTracker);
    if (!expenseHabit) return;

    const hasTodayExpense = expenses.some((e) => e.date === todayStr);
    const isCurrentlyDone = expenseHabit.selectedDateLog?.status === "done";

    if (hasTodayExpense && !isCurrentlyDone) {
      saveLogMutation.mutate({
        habitId: expenseHabit.id,
        logId: expenseHabit.selectedDateLog?.id,
        input: {
          date: todayStr,
          status: "done",
          comment: `Tracked daily expense logs`
        }
      });
    } else if (!hasTodayExpense && isCurrentlyDone && expenseHabit.selectedDateLog?.comment?.includes("Tracked daily expense logs")) {
      saveLogMutation.mutate({
        habitId: expenseHabit.id,
        logId: expenseHabit.selectedDateLog?.id,
        input: {
          date: todayStr,
          status: "not_done",
          comment: ""
        }
      });
    }
  }, [expenses, habits, todayStr]);

  const handleOpenAdd = () => {
    setEditExpense(null);
    setAmountInput("");
    setCategoryInput(CATEGORIES[0]!);
    setDateInput(new Date().toISOString().split("T")[0] || "");
    setDescriptionInput("");
    setPaymentMethodInput("UPI");
    setShowModal(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditExpense(exp);
    setAmountInput(exp.amount.toString());
    setCategoryInput(exp.category);
    setDateInput(exp.date);
    setDescriptionInput(exp.description);
    setPaymentMethodInput(exp.paymentMethod);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) return;

    const payload = {
      amount,
      category: categoryInput,
      date: dateInput,
      description: descriptionInput,
      paymentMethod: paymentMethodInput
    };

    if (editExpense) {
      await updateExpense(editExpense.id, payload);
    } else {
      await addExpense(payload);
    }
    setShowModal(false);
  };

  // Math Metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const dayOfMonth = new Date().getDate();
  const dailyAverage = totalSpent / (dayOfMonth || 1);

  // Recharts Trends Processors
  const getLineData = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayTotals: { [key: number]: number } = {};
    for (let i = 1; i <= daysInMonth; i++) dayTotals[i] = 0;

    monthlyExpenses.forEach((e) => {
      const day = new Date(e.date).getDate();
      if (dayTotals[day] !== undefined) dayTotals[day] += e.amount;
    });

    return Object.keys(dayTotals).map((dayStr) => {
      const dayNum = parseInt(dayStr);
      return {
        name: `Day ${dayNum}`,
        amount: dayTotals[dayNum]
      };
    });
  };

  const getPieData = () => {
    const totals: { [key: string]: number } = {};
    monthlyExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.keys(totals).map((cat) => ({
      name: cat,
      value: totals[cat] ?? 0
    }));
  };

  // Filters
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-app pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-content flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-emerald-500" />
            Spending Dashboard
          </h1>
          <p className="text-xs text-content-muted mt-1">Visualize your transactions and monthly budgets</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5 space-y-2 border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex justify-between items-center text-content-muted">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Monthly Spend</span>
            <Wallet className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <p className="text-2xl font-display font-extrabold text-content">
            ₹{totalSpent.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="surface-card p-5 space-y-2 border border-blue-500/20 bg-blue-500/5">
          <div className="flex justify-between items-center text-content-muted">
            <span className="text-xs font-extrabold uppercase tracking-wider">Daily Average</span>
            <Calendar className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <p className="text-2xl font-display font-extrabold text-content">
            ₹{Math.round(dailyAverage).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="surface-card p-5 space-y-2 border border-violet-500/20 bg-violet-500/5">
          <div className="flex justify-between items-center text-content-muted">
            <span className="text-xs font-extrabold uppercase tracking-wider">Active Transactions</span>
            <CreditCard className="h-4.5 w-4.5 text-violet-500" />
          </div>
          <p className="text-2xl font-display font-extrabold text-content">
            {expenses.length} Records
          </p>
        </div>
      </section>

      {/* Trends visual grids */}
      {monthlyExpenses.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-3">
          {/* Daily Trend Line Chart */}
          <div className="surface-card p-6 md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-content">Daily Spending Trend (Current Month)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getLineData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Pie Chart */}
          <div className="surface-card p-6 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-content">Category Share</h3>
            <div className="h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={getPieData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                    {getPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Pie Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold text-content-2">
              {getPieData().map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{item.name} ({Math.round((item.value / totalSpent) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <div className="py-16 text-center text-sm font-semibold text-content-muted border border-dashed rounded-2xl">
          No expenses logged yet this month. Click "Add Expense" to get started.
        </div>
      )}

      {/* History table */}
      <section className="surface-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-app/40">
          <h3 className="text-sm font-bold text-content">Recent Transactions</h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-subtle" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-xl border border-border-app bg-surface text-xs font-semibold outline-none focus:border-accent w-44"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-border-app bg-surface px-3 py-1.5 text-xs font-semibold text-content outline-none focus:border-accent"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-content-2">
            <thead>
              <tr className="border-b border-border-app/40 text-[10px] font-extrabold uppercase tracking-wider text-content-muted">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-border-app/20 hover:bg-surface-2/40 transition">
                    <td className="py-3 px-4 font-semibold text-content">{exp.date}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-surface-3 px-2 py-0.5 font-bold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-content-2 max-w-xs truncate">{exp.description || "-"}</td>
                    <td className="py-3 px-4 font-bold text-content-subtle">{exp.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-content">₹{exp.amount.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1 hover:text-accent rounded text-content-subtle"
                          title="Edit transaction"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this expense record?")) {
                              deleteExpense(exp.id);
                            }
                          }}
                          className="p-1 hover:text-rose-500 rounded text-content-subtle"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-content-muted font-semibold">
                    No transactions match the active search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Transaction Modal.
          Rendered through a portal: inside the page tree it is a sibling under
          `space-y-8`, which would push it down by a 2rem margin, and any future
          transform on an ancestor would re-anchor `fixed` away from the
          viewport. document.body has neither problem. */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="surface-card my-auto max-h-[90vh] w-full max-w-md overflow-y-auto p-5 sm:p-6 space-y-4 animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-content">
              {editExpense ? "Edit Transaction Record" : "Log New Expense"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-content-2 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 250"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border-app bg-surface px-4 py-2.5 text-sm text-content outline-none focus:border-accent"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-content-2 mb-1">Date</label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    required
                    max={todayStr}
                    className="w-full rounded-xl border border-border-app bg-surface px-4 py-2.5 text-sm text-content outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-content-2 mb-1">Category</label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full rounded-xl border border-border-app bg-surface px-4 py-2.5 text-sm text-content outline-none focus:border-accent"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-content-2 mb-1">Payment Method</label>
                  <select
                    value={paymentMethodInput}
                    onChange={(e) => setPaymentMethodInput(e.target.value)}
                    className="w-full rounded-xl border border-border-app bg-surface px-4 py-2.5 text-sm text-content outline-none focus:border-accent"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-content-2 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Groceries at supermarket"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="w-full rounded-xl border border-border-app bg-surface px-4 py-2.5 text-sm text-content outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-border-app px-4 py-2 text-xs font-bold text-content-2 hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm"
                >
                  Save Record
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
