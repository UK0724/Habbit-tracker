import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Shield,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  Settings,
  Gem
} from "lucide-react";
import { Button } from "../components/ui/Button";
import {
  useGameProfile,
  useStreakFreeze
} from "../features/gamification/hooks/useGameProfile";
import { useHabits } from "../features/habits/hooks/useHabits";
import { LevelBadge } from "../components/ui/LevelBadge";
import { XPBar } from "../components/ui/XPBar";
import { StreakBadge } from "../components/ui/StreakBadge";
import { GemCounter } from "../components/ui/GemCounter";
import { useAuthStore } from "../stores/authStore";
import { playSound } from "../shared/lib/sounds";
import { getTodayDateString } from "../shared/lib/date";

export const ProfilePage = () => {
  const { data: profile, isLoading, isError } = useGameProfile();
  const { data: habits = [] } = useHabits(getTodayDateString());
  const user = useAuthStore((s) => s.user);
  const freezeMutation = useStreakFreeze();
  const [freezeMessage, setFreezeMessage] = useState<string | null>(null);

  const handleBuyFreeze = async () => {
    try {
      await freezeMutation.mutateAsync();
      playSound("restore");
      setFreezeMessage("Streak Freeze acquired! 🛡️");
      setTimeout(() => setFreezeMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to buy freeze";
      setFreezeMessage(msg);
      setTimeout(() => setFreezeMessage(null), 3500);
    }
  };

  if (isLoading) {
    return (
      <div className="surface-card p-12 text-center text-content-muted">
        <Sparkles className="mx-auto h-10 w-10 animate-spin text-amber-500" />
        <p className="mt-3 font-semibold">Loading your champion profile…</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="surface-card p-8 text-center text-rose-500">
        <p className="font-semibold">
          Could not load profile. Please try again.
        </p>
      </div>
    );
  }

  const gems = profile.gems ?? 0;
  const freezes = profile.streakFreezes ?? 0;

  return (
    <div className="space-y-6">
      {/* Hero Profile Card */}
      <div className="surface-card relative overflow-hidden p-4 sm:p-8">
        <div className="relative mb-5 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-content-muted">
            Your profile
          </h1>
          <Link
            to="/settings"
            aria-label="Settings"
            title="Settings"
            className="flex h-11 w-11 items-center justify-center rounded-full text-content-muted transition hover:bg-surface-2 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Settings aria-hidden className="h-5 w-5" />
          </Link>
        </div>
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-amber-500/20 to-indigo-500/10 blur-3xl" />

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <LevelBadge
              level={profile.level}
              title={profile.levelTitle}
              size="lg"
              showTitle={false}
              className="shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display break-words text-2xl sm:text-3xl font-black text-content">
                  {user?.email ? user.email.split("@")[0] : "Habit Champion"}
                </h2>
              </div>
              <p className="break-all text-xs sm:text-sm text-content-muted mt-0.5">
                {user?.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StreakBadge streak={profile.loginStreak} showLabel size="sm" />
                <GemCounter gems={gems} size="sm" />
              </div>
            </div>
          </div>

          {/* Quick Trophy & Settings Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/achievements"
              className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 transition hover:bg-amber-500/15 flex-1"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Badges Collected
                  </p>
                  <p className="text-lg font-black text-content">
                    {profile.achievementCount} / 30
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-500 ml-4" />
            </Link>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="mt-5">
          <XPBar
            currentXP={profile.xpIntoLevel}
            neededXP={profile.xpNeeded}
            level={profile.level}
            levelTitle={profile.levelTitle}
          />
        </div>
      </div>

      {/* Core Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Total XP */}
        <div className="surface-card min-w-0 p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Total XP
            </span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-content">
            {profile.totalXP.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-content-muted">
            All-time points earned
          </p>
        </div>

        {/* Longest Streak */}
        <div className="surface-card min-w-0 p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Best Streak
            </span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-orange-400">
            {profile.longestStreak}{" "}
            {profile.longestStreak === 1 ? "day" : "days"}
          </p>
          <p className="mt-1 text-xs text-content-muted">
            Longest continuous check-in
          </p>
        </div>

        {/* Habits Tracked */}
        <div className="surface-card min-w-0 p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Active Habits
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-content">
            {habits.length}
          </p>
          <p className="mt-1 text-xs text-content-muted">
            Routines in progress
          </p>
        </div>

        {/* Current Login Streak */}
        <div className="surface-card min-w-0 p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Current Streak
            </span>
            <TrendingUp className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-sky-400">
            {profile.loginStreak} {profile.loginStreak === 1 ? "day" : "days"}
          </p>
          <p className="mt-1 text-xs text-content-muted">
            Active uninterrupted streak
          </p>
        </div>
      </div>

      <section
        aria-labelledby="freeze-title"
        className="surface-card p-4 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-400">
            <Shield aria-hidden className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2
              id="freeze-title"
              className="font-display text-lg font-bold text-content"
            >
              Streak protection
            </h2>
            <p className="text-xs text-content-muted">
              A little backup for busy days
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-content-muted">
          Miss a daily check-in? One freeze is used automatically to keep your
          streak.
        </p>
        <dl className="my-5 grid grid-cols-2 divide-x divide-border-app">
          <div className="pr-3">
            <dt className="text-xs text-content-muted">Freezes ready</dt>
            <dd className="mt-1 flex items-center gap-2 text-2xl font-bold text-sky-400">
              <Shield aria-hidden className="h-4 w-4" />
              {freezes}
            </dd>
          </div>
          <div className="pl-4">
            <dt className="text-xs text-content-muted">Your gems</dt>
            <dd className="mt-1 flex items-center gap-2 text-2xl font-bold text-content">
              <Gem aria-hidden className="h-4 w-4 text-cyan-400" />
              {gems}
            </dd>
          </div>
        </dl>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            disabled={gems < 2 || freezeMutation.isPending}
            onClick={() => void handleBuyFreeze()}
            className="w-full gap-2 sm:w-auto"
          >
            {freezeMutation.isPending ? "Purchasing…" : "Get a freeze"}
            <span className="flex items-center gap-1 text-xs opacity-80">
              · 2 <Gem aria-hidden className="h-3.5 w-3.5" />
            </span>
          </Button>
          <p className="text-center text-xs text-content-muted sm:text-right">
            {gems < 2
              ? "Earn " +
                (2 - gems) +
                " more " +
                (2 - gems === 1 ? "gem" : "gems") +
                " to get a freeze"
              : "Protects one missed day"}
          </p>
        </div>
        {freezeMessage && (
          <motion.p
            role="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-sm font-medium text-content"
          >
            {freezeMessage}
          </motion.p>
        )}
      </section>

      {/* Habit Masteries & Recent Activity */}
      <div className="surface-card p-6 sm:p-8">
        <h3 className="font-display text-lg font-bold text-content mb-4">
          Your Routine Portfolio
        </h3>
        {habits.length === 0 ? (
          <p className="text-sm text-content-muted">
            No habits created yet. Start with your first habit on the{" "}
            <Link
              to="/habits/new"
              className="text-accent underline font-semibold"
            >
              habit creator
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => (
              <Link
                key={habit.id}
                to={`/habits/${habit.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-border-app bg-surface-2 p-4 transition hover:border-accent"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-content group-hover:text-accent transition">
                      {habit.title}
                    </span>
                    <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-bold uppercase text-content-muted">
                      {habit.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-content-muted">
                    {habit.unit ? `Unit: ${habit.unit}` : "Action routine"}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-accent">
                  <span>View Analytics</span>
                  <span>↗</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
