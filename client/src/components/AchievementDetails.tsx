import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import type { Achievement } from "../features/gamification/hooks/useAchievements";
import { useDialog } from "../shared/hooks/useDialog";
import { Button } from "./ui/Button";

/** Viewing an earned badge never replays its reward or unlock celebration. */
export const AchievementDetails = ({ achievement, onClose }: {
  achievement: Achievement | null;
  onClose: () => void;
}) => {
  useDialog(Boolean(achievement), onClose, "[data-achievement-details]");
  if (!achievement) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <section data-achievement-details role="dialog" aria-modal="true" aria-labelledby="achievement-name"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-border-app bg-surface p-6 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label="Close achievement details" onClick={onClose}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-content-muted hover:bg-surface-2"><X size={20} /></button>
        <p className="mb-6 pr-8 text-left text-xs font-semibold uppercase tracking-wider text-content-muted">Achievement details</p>
        <span className="text-5xl" aria-hidden>{achievement.emoji ?? "🏆"}</span>
        <h2 id="achievement-name" className="mt-4 text-2xl font-bold text-content">{achievement.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-content-2">{achievement.description}</p>
        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-emerald-500"><CheckCircle2 size={16} />
          {achievement.unlockedAt ? `Unlocked ${new Date(achievement.unlockedAt).toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" })}` : "Unlocked"}
        </p>
        <p className="mt-2 text-sm text-content-muted">{achievement.xpBonus} XP{achievement.gemBonus ? ` + ${achievement.gemBonus} 💎` : ""} already earned · <span className="capitalize">{achievement.tier}</span></p>
        <Button type="button" className="mt-6 w-full" onClick={onClose}>Done</Button>
      </section>
    </div>, document.body
  );
};
