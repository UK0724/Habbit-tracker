import { useEffect, useState, useRef, useCallback } from "react";
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
  ChevronDown,
  Compass
} from "lucide-react";
import { cn } from "../shared/lib/utils";
import { BrandMark } from "../components/brand/BrandMark";
import { useAuthStore } from "../stores/authStore";
import { apiRequest } from "../services/api";
import { useGameProfile } from "../features/gamification/hooks/useGameProfile";
import { useDailyCheckin } from "../features/gamification/hooks/useDailyCheckin";
import { XPBar } from "../components/ui/XPBar";
import { StreakBadge } from "../components/ui/StreakBadge";
import { GemCounter } from "../components/ui/GemCounter";
import { FreezeCounter } from "../components/ui/FreezeCounter";
import { UserAvatar } from "../features/account/components/UserAvatar";
import { ProgressHeader } from "../components/ui/ProgressHeader";
import {
  CheckinBannerSlot,
  RewardOverlays
} from "../components/RewardOverlays";
import { CreateHabitGlobalModal } from "../features/habits/components/CreateHabitGlobalModal";
import { useCreateHabitModalStore } from "../features/habits/stores/createHabitModalStore";
import { useHomeDateStore } from "../features/habits/hooks/useHomeDateStore";
import { OnboardingWalkthrough } from "../features/onboarding/OnboardingWalkthrough";
import { useOnboardingStore } from "../features/onboarding/onboardingStore";

const TIMEZONE_KEY = "pulse-timezone";

const items = [
  ["/habits", "Habits", CheckSquare],
  ["/insights", "Insights", ChartNoAxesCombined],
  ["/expenses", "Expenses", Wallet]
] as const;

const menuItemClass =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-content-2 hover:bg-surface-3 hover:text-content focus-visible:bg-surface-3 transition";

export const AppLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: profile } = useGameProfile();
  const openCreateHabit = useCreateHabitModalStore((s) => s.open);
  const openWalkthrough = useOnboardingStore((s) => s.open);

  // Daily check-in runs once per session from whichever page loads first.
  useDailyCheckin();

  const closeMenu = useCallback((restoreFocus: boolean) => {
    setMenuOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!desktopMenuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    // Move focus into the menu so keyboard users land on the first item.
    menuRef.current
      ?.querySelector<HTMLElement>('[role="menuitem"]')
      ?.focus();
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen, closeMenu]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const entries = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    const index = entries.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      entries[(index + 1) % entries.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      entries[(index - 1 + entries.length) % entries.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      entries[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      entries[entries.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setMenuOpen(false);
    }
  };

  // Refresh the account timezone in the background. The app renders straight
  // away using the cached (or browser) timezone instead of waiting on this.
  useEffect(() => {
    let cancelled = false;
    apiRequest<{ timezone: string }>("/preferences")
      .then((p) => {
        if (cancelled || !p?.timezone) return;
        let previous: string | null = null;
        try {
          previous = localStorage.getItem(TIMEZONE_KEY);
          localStorage.setItem(TIMEZONE_KEY, p.timezone);
        } catch {
          return;
        }
        if (previous !== p.timezone) {
          useHomeDateStore.getState().resetSelectedDate();
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const streak = profile?.loginStreak ?? 1;
  const gems = profile?.gems ?? 0;

  const renderProfileDropdown = () => (
    <div
      ref={menuRef}
      id="profile-menu"
      role="menu"
      aria-label="Account"
      onKeyDown={handleMenuKeyDown}
      className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-border-app bg-surface-2/95 backdrop-blur-2xl p-2 shadow-2xl z-50 animate-fade-in"
    >
      <div className="border-b border-border-app px-3 py-2.5">
        <p className="text-xs font-bold text-content truncate">{user?.email}</p>
        {profile && (
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
            Level {profile.level} · {profile.levelTitle}
          </p>
        )}
      </div>

      <div className="py-1">
        <Link
          to="/profile"
          role="menuitem"
          onClick={() => setMenuOpen(false)}
          className={menuItemClass}
        >
          <User size={15} aria-hidden />
          <span>Profile</span>
        </Link>

        <Link
          to="/settings"
          role="menuitem"
          onClick={() => setMenuOpen(false)}
          className={menuItemClass}
        >
          <Settings size={15} aria-hidden />
          <span>Settings</span>
        </Link>

        <Link
          to="/achievements"
          role="menuitem"
          onClick={() => setMenuOpen(false)}
          className={menuItemClass}
        >
          <Trophy size={15} aria-hidden />
          <span>Trophy Room</span>
        </Link>

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            // Focus returns to the account button when the walkthrough closes.
            closeMenu(true);
            openWalkthrough(0);
          }}
          className={menuItemClass}
        >
          <Compass size={15} aria-hidden />
          <span>How Pulse works</span>
        </button>
      </div>

      <div className="border-t border-border-app pt-1">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setMenuOpen(false);
            clearAuth();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 focus-visible:bg-rose-500/10 transition dark:text-rose-400"
        >
          <LogOut size={15} aria-hidden />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-content">
      <RewardOverlays />
      <OnboardingWalkthrough />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-surface focus:p-4"
      >
        Skip to content
      </a>

      {/* Mobile Branding Bar (logo + gamification only — no nav) */}
      <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b border-border-app bg-surface/95 backdrop-blur-xl px-3 lg:hidden">
        <Link
          to="/habits"
          aria-label="Pulse home"
          className="flex min-h-11 shrink-0 items-center justify-center rounded-lg px-1"
        >
          <BrandMark className="h-7 w-7" />
        </Link>

        <ProgressHeader xp={profile?.totalXP} gems={profile?.gems} streak={profile?.loginStreak} freezes={profile?.streakFreezes} />
      </header>

      {/* Sidebar Navigation (Desktop only) */}
      <aside className="hidden fixed inset-y-0 left-0 z-30 w-60 border-r border-border-app bg-surface p-6 overflow-y-auto lg:block">
        <Link
          to="/habits"
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
              <span className="font-extrabold text-amber-600 dark:text-amber-400">
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
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
              <StreakBadge streak={streak} size="sm" />
              <span className="flex items-center gap-1.5">
                <GemCounter gems={gems} size="sm" />
                <FreezeCounter freezes={profile.streakFreezes ?? 0} />
              </span>
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
          <ProgressHeader xp={profile?.totalXP} gems={profile?.gems} streak={profile?.loginStreak} freezes={profile?.streakFreezes} />

          {/* Profile Icon Dropdown Trigger */}
          <div ref={desktopMenuRef} className="relative">
            <button
              type="button"
              ref={menuButtonRef}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? "profile-menu" : undefined}
              className="flex items-center gap-2.5 rounded-full border border-border-app bg-surface-2 pl-2 pr-3 py-1.5 transition hover:border-accent hover:bg-surface-3 group shadow-sm active:scale-95 cursor-pointer"
            >
              <UserAvatar className="h-8 w-8 text-xs" />
              <div className="text-left">
                <p className="text-xs font-bold text-content group-hover:text-accent transition truncate max-w-[130px]">
                  {user?.email?.split("@")[0] || "Profile"}
                </p>
                {profile && (
                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
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
          <CheckinBannerSlot />
          <CreateHabitGlobalModal />
          <Outlet />
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
