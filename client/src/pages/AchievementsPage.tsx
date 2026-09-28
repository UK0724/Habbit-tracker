import { useState } from "react";
import { motion } from "framer-motion";
import { Lock,Sparkles,Trophy,CheckCircle2 } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { useAchievements,type Achievement } from "../features/gamification/hooks/useAchievements";
import { AchievementDetails } from "../components/AchievementDetails";
import type { AchievementTier } from "../shared/lib/gamification";
import { cn } from "../shared/lib/utils";

const TIER_ORDER: AchievementTier[] = ["bronze", "silver", "gold", "platinum"];

const TIER_CONFIG: Record<
  AchievementTier,
  {
    name: string;
    label: string;
    border: string;
    bg: string;
    pill: string;
    accent: string;
    icon: string;
  }
> = {
  bronze: {
    name: "Bronze",
    label: "Beginner milestones",
    border: "border-amber-700/40",
    bg: "from-amber-950/20 via-surface to-surface-2",
    pill: "bg-amber-800/20 text-amber-400 border-amber-700/30",
    accent: "text-amber-500",
    icon: "🥉"
  },
  silver: {
    name: "Silver",
    label: "Consistent achievements",
    border: "border-slate-400/40",
    bg: "from-slate-800/20 via-surface to-surface-2",
    pill: "bg-slate-700/20 text-slate-300 border-slate-500/30",
    accent: "text-slate-300",
    icon: "🥈"
  },
  gold: {
    name: "Gold",
    label: "Mastery and discipline",
    border: "border-yellow-400/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]",
    bg: "from-yellow-950/20 via-surface to-surface-2",
    pill: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
    accent: "text-yellow-400",
    icon: "🥇"
  },
  platinum: {
    name: "Platinum",
    label: "Legendary & apex feats",
    border: "border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.2)]",
    bg: "from-cyan-950/20 via-surface to-surface-2",
    pill: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
    accent: "text-cyan-300",
    icon: "💎"
  }
};

export const AchievementsPage = () => {
  const { data: achievements = [], isLoading, isError, refetch } = useAchievements();
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const unlockedList = achievements.filter((a) => a.unlocked);
  const totalCount = achievements.length;
  const unlockedCount = unlockedList.length;
  const percent = totalCount ? Math.round((unlockedCount / totalCount) * 100) : 0;
  const totalXPEarned = unlockedList.reduce((sum, a) => sum + a.xpBonus, 0);
  const totalGemsEarned = unlockedList.reduce(
    (sum, a) => sum + (a.gemBonus ?? 0),
    0
  );
  const emptyMessage =
    selectedTier === "unlocked"
      ? "No badges unlocked yet. Complete your first quest to earn one."
      : selectedTier === "all"
        ? "No achievements to show right now."
        : `No ${selectedTier} badges to show yet.`;

  const filteredAchievements = achievements.filter((a) => {
    if (selectedTier === "unlocked") return a.unlocked;
    if (selectedTier !== "all") return a.tier === selectedTier;
    return true;
  }).sort((a, b) => Number(b.unlocked) - Number(a.unlocked)
    || (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? "")
    || TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
  const groups = [
    { title: "Unlocked", items: filteredAchievements.filter((a) => a.unlocked) },
    { title: "Next milestones", items: filteredAchievements.filter((a) => !a.unlocked) }
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Trophy Room"
        title="Achievements"
        description="Your progress, one milestone at a time."
      />

      {/* Overview Progress Card */}
      <div className="surface-card relative overflow-hidden p-4 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Overall Progress
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-3xl font-extrabold text-content">
                {unlockedCount} / {totalCount}
              </span>
              <span className="text-sm font-semibold text-amber-500">
                {percent}% unlocked
              </span>
            </div>
            <p className="text-xs text-content-muted">
              +{totalXPEarned.toLocaleString()} bonus XP
              {totalGemsEarned > 0 ? ` · +${totalGemsEarned} 💎` : ""} earned
            </p>
          </div>

          {/* Mini Tier counts */}
          <div className="grid w-full grid-cols-4 gap-1 border-t border-border-app/60 pt-4">
            {TIER_ORDER.map((tier) => {
              const tierList = achievements.filter((a) => a.tier === tier);
              const tierDone = tierList.filter((a) => a.unlocked).length;
              return (
                <div
                  key={tier}
                  className="min-w-0 py-1 text-center"
                >
                  <span className="text-base">{TIER_CONFIG[tier].icon}</span>
                  <p className="text-[10px] sm:text-xs font-medium text-content-muted mt-1">
                    {TIER_CONFIG[tier].name}
                  </p>
                  <p className="text-sm font-black text-content mt-1">
                    {tierDone}/{tierList.length}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 shadow-[0_0_14px_rgba(245,158,11,0.5)]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={selectedTier === "all"} onClick={() => setSelectedTier("all")}
          className={cn(
            "min-h-11 rounded-full px-3 py-2 text-xs sm:text-sm font-bold transition",
            selectedTier === "all"
              ? "bg-accent text-accent-fg shadow-sm"
              : "bg-surface-2 text-content-2 hover:bg-surface-3"
          )}
        >
          All ({totalCount})
        </button>
        {TIER_ORDER.map((tier) => {
          const count = achievements.filter((a) => a.tier === tier).length;
          return (
            <button
              key={tier}
              type="button"
              aria-pressed={selectedTier === tier} onClick={() => setSelectedTier(tier)}
              className={cn(
                "min-h-11 rounded-full px-3 py-2 text-xs sm:text-sm font-bold capitalize transition",
                selectedTier === tier
                  ? "bg-accent text-accent-fg shadow-sm"
                  : "bg-surface-2 text-content-2 hover:bg-surface-3"
              )}
            >
              {tier} ({count})
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={selectedTier === "unlocked"} onClick={() => setSelectedTier("unlocked")}
          className={cn(
            "min-h-11 rounded-full px-3 py-2 text-xs sm:text-sm font-bold transition",
            selectedTier === "unlocked"
              ? "bg-accent text-accent-fg shadow-sm"
              : "bg-surface-2 text-content-2 hover:bg-surface-3"
          )}
        >
          Unlocked ({unlockedCount})
        </button>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="surface-card p-12 text-center text-content-muted">
          <Trophy className="mx-auto h-10 w-10 animate-bounce text-amber-500" />
          <p className="mt-3 font-semibold">Loading achievements gallery…</p>
        </div>
      )}

      {isError && (
        <div role="alert" className="surface-card p-8 text-center text-rose-600">
          <p className="font-semibold">Could not load achievements.</p>
          <button type="button" className="mt-3 min-h-11 text-accent" onClick={() => void refetch()}>Try again</button>
        </div>
      )}

      {/* Badge Grid */}
      {!isLoading && !isError && (
        <div className="space-y-6">
          {filteredAchievements.length === 0 && <p role="status" className="py-8 text-center text-content-muted">{emptyMessage}</p>}
          {groups.filter((group) => group.items.length > 0).map((group) => (
          <section key={group.title} aria-label={group.title}>
          <h2 className="mb-3 text-sm font-semibold text-content-2">{group.title} <span className="text-content-muted">({group.items.length})</span></h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {group.items.map((achievement) => {
            const isUnlocked = achievement.unlocked;
            const cfg = TIER_CONFIG[achievement.tier] ?? TIER_CONFIG.bronze;

            return (
              <article
                key={achievement.id}
                className={cn(
                  "relative min-w-0 flex flex-col justify-between rounded-2xl border p-4",
                  isUnlocked
                    ? "border-border-app bg-surface"
                    : "border-border-app/50 bg-surface"
                )}
              >
                {/* Top Row: Icon + Tier Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl select-none",
                      isUnlocked
                        ? "border-amber-400/30 bg-surface-2"
                        : "border-border-app bg-surface-3 text-content-muted"
                    )}
                  >
                    {isUnlocked ? (
                      achievement.emoji ?? "🏆"
                    ) : (
                      <Lock className="h-7 w-7 text-content-muted" />
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                        cfg.pill
                      )}
                    >
                      {achievement.tier}
                    </span>
                    <span className="flex items-center gap-1 rounded-lg bg-surface-3 px-2 py-0.5 text-xs font-bold text-amber-400">
                      <Sparkles className="h-3 w-3" aria-hidden />+{achievement.xpBonus} XP
                    </span>
                    {achievement.gemBonus ? (
                      <span className="flex items-center gap-1 rounded-lg bg-surface-3 px-2 py-0.5 text-xs font-bold text-cyan-400">
                        <span aria-hidden>💎</span>+{achievement.gemBonus}
                        <span className="sr-only">
                          {achievement.gemBonus === 1 ? " gem" : " gems"}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Body: Title + Description */}
                <div className="mt-4">
                  <h3 className="font-display text-base font-bold text-content">
                    {achievement.name}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-content-muted">
                    {achievement.description}
                  </p>
                </div>

                {/* Footer: Unlocked date or Locked label */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {achievement.unlockedAt
                        ? `Unlocked ${new Date(achievement.unlockedAt).toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" })}`
                        : "Unlocked"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-content-muted font-medium">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                  {isUnlocked && (
                    <button type="button" aria-label={`View ${achievement.name} details`} onClick={(event) => { event.currentTarget.focus(); setSelectedAchievement(achievement); }} className="min-h-11 rounded-lg px-2 text-xs font-semibold text-accent hover:bg-accent/10">Details</button>
                  )}
                </div>
              </article>
            );
          })}
          </div>
          </section>
          ))}
        </div>
      )}

      {/* Modal Preview when badge is clicked */}
      <AchievementDetails
        onClose={() => setSelectedAchievement(null)}
        achievement={selectedAchievement}
      />
    </div>
  );
};
