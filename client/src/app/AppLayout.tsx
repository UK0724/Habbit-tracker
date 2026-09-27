import { useEffect, useState, useRef } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  CheckSquare,
  ChartNoAxesCombined,
  Wallet,
  Settings,
  Trophy,
  User,
  Plus,
  LogOut,
  ChevronDown
} from "lucide-react";
import { cn } from "../shared/lib/utils";
import { ReminderWatcher } from "../components/ReminderWatcher";
import { BrandMark } from "../components/brand/BrandMark";
import { useAuthStore } from "../stores/authStore";
import { apiRequest } from "../services/api";
import { useGameProfile } from "../features/gamification/hooks/useGameProfile";
import { XPBar } from "../components/ui/XPBar";
import { StreakBadge } from "../components/ui/StreakBadge";
import { GemCounter } from "../components/ui/GemCounter";
import { ProgressHeader } from "../components/ui/ProgressHeader";
import { CreateHabitGlobalModal } from "../features/habits/components/CreateHabitGlobalModal";
import { useCreateHabitModalStore } from "../features/habits/stores/createHabitModalStore";
import { useHomeDateStore } from "../features/habits/hooks/useHomeDateStore";

const items = [
  ["/habits", "Habits", CheckSquare],
  ["/insights", "Insights", ChartNoAxesCombined],
  ["/expenses", "Expenses", Wallet]
] as const;

export const AppLayout = () => {
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: profile } = useGameProfile();
  const openCreateHabit = useCreateHabitModalStore((s) => s.open);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!desktopMenuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  useEffect(() => {
    apiRequest<{ timezone: string }>("/preferences")
      .then((p) => {
        localStorage.setItem("pulse-timezone", p.timezone);
        useHomeDateStore.getState().resetSelectedDate();
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const streak = profile?.loginStreak ?? 1;
  const gems = profile?.gems ?? 0;

  const renderProfileDropdown = () => (
    <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-border-app bg-surface-2/95 backdrop-blur-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="border-b border-border-app px-3 py-2.5">
        <p className="text-xs font-bold text-content truncate">{user?.email}</p>
        {profile && (
          <p className="text-[11px] font-semibold text-amber-500 mt-0.5">
            Level {profile.level} · {profile.levelTitle}
          </p>
        )}
      </div>

      <div className="py-1">
        <Link
          to="/profile"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-content-2 hover:bg-surface-3 hover:text-content transition"
        >
          <User size={15} />
          <span>Profile</span>
        </Link>

        <Link
          to="/settings"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-content-2 hover:bg-surface-3 hover:text-content transition"
        >
          <Settings size={15} />
          <span>Settings</span>
        </Link>

        <Link
          to="/achievements"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-content-2 hover:bg-surface-3 hover:text-content transition"
        >
          <Trophy size={15} />
          <span>Badges & Trophies</span>
        </Link>
      </div>

      <div className="border-t border-border-app pt-1">
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            clearAuth();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-content">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-surface focus:p-4"
      >
        Skip to content
      </a>

      {/* Mobile Branding Bar (logo + gamification only — no nav) */}
      <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b border-border-app bg-surface/95 backdrop-blur-xl px-3 lg:hidden">
        <Link
          to="/"
          aria-label="Pulse home"
          className="flex min-h-11 shrink-0 items-center justify-center rounded-lg px-1"
        >
          <BrandMark className="h-7 w-7" />
        </Link>

        <ProgressHeader xp={profile?.totalXP} gems={profile?.gems} streak={profile?.loginStreak} />
      </header>

      {/* Sidebar Navigation (Desktop only) */}
      <aside className="hidden fixed inset-y-0 left-0 z-30 w-60 border-r border-border-app bg-surface p-6 overflow-y-auto lg:block">
        <Link
          to="/"
          className="mb-8 flex items-center gap-3 font-display text-2xl font-bold"
        >
          <BrandMark className="h-9 w-9" />
          Pulse<span className="text-accent font-black">.</span>
        </Link>

        {/* Sidebar Level & XP Strip on Desktop */}
        {profile && (
          <Link
            to="/profile"
            className="mb-6 block group rounded-2xl border border-border-app bg-surface-2 p-3 transition hover:border-accent"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-content group-hover:text-accent transition">
                {profile.levelTitle}
              </span>
              <span className="font-extrabold text-amber-500">
                Lv.{profile.level}
              </span>
            </div>
            <div className="mt-2">
              <XPBar
                compact
                currentXP={profile.xpIntoLevel}
                neededXP={profile.xpNeeded}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px]">
              <StreakBadge streak={streak} size="sm" />
              <GemCounter gems={gems} size="sm" />
            </div>
          </Link>
        )}

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-content-muted">
          Your everyday space
        </p>

        <nav
          id="primary-navigation"
          aria-label="Main navigation"
          className="grid grid-cols-1 gap-1"
        >
          {items.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-content-2 hover:bg-surface-2"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Desktop Top Navigation Bar (Fixed/Sticky) */}
      <header className="hidden lg:flex h-16 items-center justify-between border-b border-border-app bg-surface/90 backdrop-blur-xl px-8 sticky top-0 z-30 lg:ml-60 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2" />

        <div className="flex items-center gap-4">
          <ProgressHeader xp={profile?.totalXP} gems={profile?.gems} streak={profile?.loginStreak} />

          {/* Profile Icon Dropdown Trigger */}
          <div ref={desktopMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="User Profile & Settings menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2.5 rounded-full border border-border-app bg-surface-2 pl-2 pr-3 py-1.5 transition hover:border-accent hover:bg-surface-3 group shadow-sm active:scale-95 cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-accent via-violet-600 to-fuchsia-500 text-xs font-black text-white shadow-sm">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-content group-hover:text-accent transition truncate max-w-[130px]">
                  {user?.email?.split("@")[0] || "Profile"}
                </p>
                {profile && (
                  <p className="text-[10px] font-semibold text-amber-500">
                    Lv.{profile.level} · {profile.levelTitle}
                  </p>
                )}
              </div>
              <ChevronDown
                size={14}
                className={cn(
                  "text-content-muted transition-transform duration-200",
                  menuOpen && "rotate-180"
                )}
              />
            </button>

            {menuOpen && renderProfileDropdown()}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        id="main"
        tabIndex={-1}
        className="min-w-0 flex-1 overflow-x-hidden px-3.5 pt-5 pb-24 sm:px-6 lg:ml-60 lg:px-8 lg:py-8"
      >
        <div className="mx-auto max-w-6xl w-full min-w-0 overflow-x-hidden">
          {ready ? (
            <>
              <ReminderWatcher />
              <CreateHabitGlobalModal />
              <Outlet />
            </>
          ) : (
            <p role="status">Getting your workspace ready…</p>
          )}
        </div>
      </main>

      {/* Mobile Floating Bottom Dock */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-border-app bg-surface/92 backdrop-blur-xl px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] lg:hidden"
      >
        <NavLink
          to="/habits"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-bold transition ${
              isActive ? "text-accent" : "text-content-muted hover:text-content"
            }`
          }
        >
          <CheckSquare size={20} />
          <span>Habits</span>
        </NavLink>

        <NavLink
          to="/insights"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-bold transition ${
              isActive ? "text-accent" : "text-content-muted hover:text-content"
            }`
          }
        >
          <ChartNoAxesCombined size={20} />
          <span>Insights</span>
        </NavLink>

        {/* Center Elevate Action (+) Button */}
        <button
          type="button"
          onClick={() => openCreateHabit()}
          aria-label="Create new habit"
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/35 transition active:scale-95 hover:scale-105 cursor-pointer"
        >
          <Plus size={24} strokeWidth={2.8} />
        </button>

        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-bold transition ${
              isActive ? "text-accent" : "text-content-muted hover:text-content"
            }`
          }
        >
          <Wallet size={20} />
          <span>Expenses</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-bold transition ${
              isActive ? "text-accent" : "text-content-muted hover:text-content"
            }`
          }
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};
