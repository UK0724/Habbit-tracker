import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCelebrationStore } from "../stores/achievementStore";
import { playSoundEffect, preloadSounds } from "../utils/sound";
import { useShare } from "../hooks/useShare";
import { AchievementBanner } from "./AchievementBanner";
import { LevelUpModal } from "./LevelUpModal";
import { RewardToast } from "./RewardToast";
import { StreakLostSheet } from "./StreakLostSheet";

/** Gap so the XP toast reads before a modal covers the screen. */
const TOAST_LEAD_MS = 700;

/** Renders the global celebration queue (toast + one modal at a time). */
export function CelebrationHost() {
  const toast = useCelebrationStore((state) => state.toast);
  const current = useCelebrationStore((state) => state.current);
  const dismiss = useCelebrationStore((state) => state.dismiss);
  const dismissToast = useCelebrationStore((state) => state.dismissToast);
  const { share, sharing } = useShare();
  const [shownId, setShownId] = useState<number | null>(null);
  const toastAt = useRef(0);
  const lastKind = useRef<string | null>(null);

  useEffect(() => {
    void preloadSounds();
  }, []);

  useEffect(() => {
    if (!toast) return;
    toastAt.current = Date.now();
    if (toast.xp > 0 || toast.gems > 0 || (toast.checkin?.xp ?? 0) > 0) void playSoundEffect("xp");
  }, [toast]);

  useEffect(() => {
    if (!current) {
      setShownId(null);
      return;
    }
    // iOS can't present a modal while the slide-out of the previous one runs.
    const wait = Math.max(
      TOAST_LEAD_MS - (Date.now() - toastAt.current),
      lastKind.current === "streak" ? 350 : 0,
      0
    );
    const timer = setTimeout(() => {
      setShownId(current.id);
      lastKind.current = current.kind;
      if (current.kind === "levelUp") void playSoundEffect("levelup");
      else if (current.kind === "achievement" && current.mode === "unlock")
        void playSoundEffect("achievement");
    }, wait);
    return () => clearTimeout(timer);
  }, [current]);

  const hideToast = useCallback(() => dismissToast(), [dismissToast]);
  const dismissCurrent = useCallback(() => dismiss(current?.id), [dismiss, current]);
  const visible = current && current.id === shownId ? current : null;

  return (
    <>
      <RewardToast toast={toast} onHide={hideToast} />
      <AchievementBanner
        celebration={visible?.kind === "achievement" ? visible : null}
        onDismiss={dismissCurrent}
        sharing={sharing}
        onShare={(achievement) => void share({ kind: "achievement", achievement })}
      />
      <LevelUpModal
        celebration={visible?.kind === "levelUp" ? visible : null}
        onDismiss={dismissCurrent}
        sharing={sharing}
        onShare={(levelUp) => void share({ kind: "levelUp", level: levelUp.level, title: levelUp.title })}
      />
      <StreakLostSheet
        celebration={visible?.kind === "streak" ? visible : null}
        onDismiss={dismissCurrent}
      />
    </>
  );
}
