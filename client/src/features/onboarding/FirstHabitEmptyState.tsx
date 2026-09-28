import { useQueryClient } from "@tanstack/react-query";
import { Compass, Plus } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { StreakFlame } from "../../components/viz/StreakFlame";
import { useCreateHabitModalStore } from "../habits/stores/createHabitModalStore";
import { templates } from "../habits/templates";
import {
  cachedLoginStreak,
  celebrateHabitCreated,
  useOnboardingStore
} from "./onboardingStore";

/** Shown on the Today / Habits views while the account has no habits. */
export const FirstHabitEmptyState = () => {
  const queryClient = useQueryClient();
  const openCreateHabit = useCreateHabitModalStore((s) => s.open);
  const openWalkthrough = useOnboardingStore((s) => s.open);

  const startCreate = (defaults?: (typeof templates)[number]) => {
    const streakBefore = cachedLoginStreak(queryClient);
    openCreateHabit(defaults, {
      onSuccess: () => celebrateHabitCreated(queryClient, streakBefore)
    });
  };

  return (
    <section
      aria-labelledby="first-habit-title"
      className="surface-card relative overflow-hidden border border-border-app px-5 py-8 text-center shadow-sm sm:px-10 sm:py-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/15 blur-3xl"
      />
      <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 to-accent/10 ring-1 ring-amber-500/30">
        <StreakFlame count={0} size={34} />
      </div>
      <h2
        id="first-habit-title"
        className="relative font-display text-xl font-bold tracking-tight text-content sm:text-2xl"
      >
        Add your first habit to start your streak 🔥
      </h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-content-muted">
        Pick one small thing you want to do every day. Your streak begins the
        moment you create it.
      </p>

      <div className="relative mt-6 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
        <Button
          type="button"
          onClick={() => startCreate()}
          className="cursor-pointer font-bold shadow-md shadow-accent/20"
        >
          <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" aria-hidden />
          Add your first habit
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => openWalkthrough(0)}
          className="cursor-pointer font-bold"
        >
          <Compass className="mr-1.5 h-4 w-4" aria-hidden />
          How Pulse works
        </Button>
      </div>

      <p className="relative mb-3 mt-8 text-xs font-semibold uppercase tracking-widest text-content-muted">
        Or start from a template
      </p>
      <div className="relative grid gap-2.5 text-left sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <button
            key={t.title}
            type="button"
            onClick={() => startCreate(t)}
            className="group flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-border-app px-4 py-3 text-sm font-semibold text-content transition hover:border-accent hover:bg-surface-2"
          >
            <span>{t.title}</span>
            <span
              aria-hidden
              className="font-bold text-accent transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            >
              ↗
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
