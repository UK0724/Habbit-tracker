import { useRewardStore } from "../features/gamification/rewards";
import { useGameProfile } from "../features/gamification/hooks/useGameProfile";
import { XPToast } from "./ui/XPToast";
import { StreakLostScreen } from "./StreakLostScreen";
import { LevelUpModal } from "./LevelUpModal";
import { AchievementBanner } from "./AchievementBanner";
import { CelebrationOverlay } from "./CelebrationOverlay";
import { DailyCheckInBanner } from "./DailyCheckInBanner";

/**
 * App-wide reward feedback driven by server RewardSummary objects. Only one
 * dialog is shown at a time: streak lost → level up → badges → Legendary Day.
 */
export const RewardOverlays = () => {
  const { data: profile } = useGameProfile();
  const streakLost = useRewardStore((s) => s.streakLost);
  const levelUp = useRewardStore((s) => s.levelUp);
  const achievement = useRewardStore((s) => s.achievements[0] ?? null);
  const legendary = useRewardStore((s) => s.legendary);
  const dismissStreakLost = useRewardStore((s) => s.dismissStreakLost);
  const dismissLevelUp = useRewardStore((s) => s.dismissLevelUp);
  const dismissAchievement = useRewardStore((s) => s.dismissAchievement);
  const dismissLegendary = useRewardStore((s) => s.dismissLegendary);

  const active = streakLost
    ? "streak"
    : levelUp
      ? "level"
      : achievement
        ? "achievement"
        : legendary
          ? "legendary"
          : null;

  return (
    <>
      <XPToast />
      <StreakLostScreen
        isOpen={active === "streak"}
        onClose={dismissStreakLost}
        result={streakLost}
      />
      {active === "level" && levelUp ? (
        <LevelUpModal
          isOpen
          onClose={dismissLevelUp}
          level={levelUp.level}
          title={levelUp.title || undefined}
          gemsReward={levelUp.gems}
        />
      ) : null}
      {active === "achievement" && achievement ? (
        <AchievementBanner
          key={achievement.id}
          isOpen
          onClose={dismissAchievement}
          achievement={achievement}
        />
      ) : null}
      <CelebrationOverlay
        isOpen={active === "legendary"}
        onClose={dismissLegendary}
        streak={profile?.loginStreak}
      />
    </>
  );
};

/** Inline daily check-in confirmation shown at the top of the page content. */
export const CheckinBannerSlot = () => {
  const banner = useRewardStore((s) => s.checkinBanner);
  const dismiss = useRewardStore((s) => s.dismissCheckinBanner);
  if (!banner) return null;
  return (
    <DailyCheckInBanner
      className="mb-5"
      streak={banner.streak}
      xpAwarded={banner.xpAwarded}
      freezeUsed={banner.freezeUsed}
      onDismiss={dismiss}
    />
  );
};
