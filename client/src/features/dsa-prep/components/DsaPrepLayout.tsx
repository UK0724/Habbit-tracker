import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";
import { useDsaPrepStore } from "../stores/dsaPrepStore";
import { useHabits } from "../../habits/hooks/useHabits";
import {
  BookOpen,
  ArrowLeft,
  Menu,
  X,
  Sparkles,
  Trophy,
  Activity
} from "lucide-react";

export const DsaPrepLayout = () => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const fetchProfile = useDsaPrepStore((s) => s.fetchProfile);
  const solvedProblems = useDsaPrepStore((s) => s.solvedProblems);

  const todayStr = new Date().toISOString().split("T")[0] || "";
  const { data: habits } = useHabits(todayStr);
  const linkedHabit = habits?.find((h) => h.linkToDSAPrep);
  const activeStreak = linkedHabit
    ? linkedHabit.stats.type === "action"
      ? linkedHabit.stats.currentStreak
      : 0
    : 0;

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, user]);

  const solvedCount = solvedProblems.length;
  const progressPercent = Math.round((solvedCount / 500) * 100);

  const menuItems = [
    { name: "Back to Habits", path: "/", icon: ArrowLeft },
    { name: "DSA Prep Dashboard", path: "/dsa-prep", icon: BookOpen }
  ];

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col gap-6 lg:flex-row animate-fade-in">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden w-64 shrink-0 flex-col gap-4 lg:flex animate-fade-in-up">
        <div className="surface-card flex flex-col gap-1 p-3">
          <div className="px-3 py-3 border-b border-border-app/50 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-pulse" />
              DSA Prep Workspace
            </p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-content-2 font-semibold">
                <span>Streak</span>
                <span className="text-amber-500 font-bold flex items-center gap-1">🔥 {activeStreak} Days</span>
              </div>
              <div className="flex items-center justify-between text-xs text-content-2 font-semibold">
                <span>Progress</span>
                <span className="text-violet-600 dark:text-violet-400 font-bold">{solvedCount} / 500 ({progressPercent}%)</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full bg-violet-600 transition-all duration-500"
                style={{ width: `${Math.max(2, progressPercent)}%` }}
              />
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-content-2 hover:bg-surface-3 hover:text-content"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Info panel */}
        <div className="surface-card p-4 text-xs text-content-muted space-y-3">
          <div className="flex items-center text-content font-semibold border-b border-border-app/40 pb-2 gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            Interview Challenge
          </div>
          <p className="leading-relaxed">
            Consistently solve one or more DSA problems each day to maintain your study habit streak and prepare for top-tier tech companies.
          </p>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="flex items-center justify-between rounded-2xl border border-border-app bg-surface p-4 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-content flex items-center gap-1.5">
            <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            DSA Prep
          </span>
          <span className="rounded bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30">
            {solvedCount}/500 Solved
          </span>
          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 ring-1 ring-amber-500/30">
            🔥 {activeStreak}
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          className="rounded-xl border border-border-app bg-surface-2 p-2 text-content-2 hover:bg-surface-3"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 pt-20 backdrop-blur-sm lg:hidden">
          <div className="surface-card mx-4 flex flex-col gap-1 p-3 animate-pop-in">
            <div className="border-b border-border-app/50 pb-3 mb-2 px-3">
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400">DSA Prep Workspace</p>
              <p className="text-sm font-bold mt-0.5">Problems solved: {solvedCount} / 500</p>
            </div>
            <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto">
              {menuItems.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-violet-600 text-white"
                        : "text-content-2 hover:bg-surface-3"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 space-y-6 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};
