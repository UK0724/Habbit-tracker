export const CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Entertainment",
  "Shopping",
  "Bills",
  "Misc"
] as const;

export type ExpenseCategory = (typeof CATEGORIES)[number];

export const CATEGORY_CONFIG: Record<
  string,
  { emoji: string; color: string; bg: string; border: string }
> = {
  Food: { emoji: "🍕", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  Transport: { emoji: "🚗", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  Rent: { emoji: "🏠", color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  Entertainment: { emoji: "🎬", color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  Shopping: { emoji: "🛍️", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  Bills: { emoji: "💡", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  Misc: { emoji: "📦", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" }
};

