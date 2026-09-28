import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Volume2,VolumeX,Bell,BellOff,Check,Sun,Moon,Monitor,Compass, type LucideIcon } from "lucide-react";
import { TrackingPreferences } from "../components/TrackingPreferences";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { deleteAccountApi } from "../services/authApi";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { ACCENT_PRESETS,ThemeMode } from "../shared/lib/theme";
import { cn } from "../shared/lib/utils";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import { isSoundEnabled,setSoundEnabled,playSound } from "../shared/lib/sounds";
import { usePushNotifications } from "../features/notifications/usePushNotifications";
import { AvatarUploader } from "../features/account/components/AvatarUploader";
import { useOnboardingStore } from "../features/onboarding/onboardingStore";

const MODES: { value: ThemeMode; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor }
];

export const SettingsPage = () => {
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);

  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const {
    isSupported: isPushSupported,
    isSubscribed,
    isLoading: isPushLoading,
    error: pushError,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush
  } = usePushNotifications();

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const openWalkthrough = useOnboardingStore((s) => s.open);

  const handleSoundToggle = (enabled: boolean) => {
    setSoundOn(enabled);
    setSoundEnabled(enabled);
    if (enabled) {
      playSound("xp");
    }
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribePush();
    } else {
      await subscribePush();
    }
  };

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
    navigate("/login");
  };

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const handleDeleteAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!window.confirm("Permanently delete your account and all data? This cannot be undone.")) return;
    setDeleteError("");
    setIsDeletingAccount(true);
    try {
      await deleteAccountApi(deletePassword);
      handleLogout();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete account.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-w-0 space-y-3">
      <PageHeader
        eyebrow="Profile"
        title="Settings"
        description="Make Pulse feel right for you. Appearance changes apply instantly."
      />

      {/* Sound & Notifications Section */}
      <SectionCard
        title="Sound & Notifications"
        description="Configure audio feedback and web push alerts for habit consistency."
      >
        <div className="space-y-6">
          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-content">
                {soundOn ? (
                  <Volume2 className="h-5 w-5 text-accent" />
                ) : (
                  <VolumeX className="h-5 w-5 text-content-muted" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-content">Sound Effects</p>
                <p className="text-xs text-content-muted">
                  Play game audio on completion, level ups, and achievements
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-label="Sound effects"
              aria-checked={soundOn}
              onClick={() => handleSoundToggle(!soundOn)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                soundOn ? "bg-accent" : "bg-surface-3"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  soundOn ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Web Push Notifications */}
          <div className="flex items-center justify-between gap-4 border-t border-border-app pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-content">
                {isSubscribed ? (
                  <Bell className="h-5 w-5 text-accent" />
                ) : (
                  <BellOff className="h-5 w-5 text-content-muted" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-content">
                    Web Push Notifications
                  </p>
                  {isSubscribed && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-content-muted">
                  {isPushSupported
                    ? "Receive daily reminders and streak danger alerts on your device"
                    : "Push notifications are not supported on this browser"}
                </p>
                {pushError && (
                  <p className="mt-1 text-xs text-rose-500">{pushError}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-label="Web push notifications"
              aria-checked={isSubscribed}
              disabled={!isPushSupported || isPushLoading}
              onClick={() => void handlePushToggle()}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed",
                isSubscribed ? "bg-accent" : "bg-surface-3"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  isSubscribed ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Appearance Section */}
      <SectionCard
        title="Appearance"
        description="Choose a theme and an accent color."
      >
        <div className="space-y-6">
          <div>
            <p className="field-label">Theme</p>
            <div role="group" aria-label="Theme" className="grid w-full max-w-md grid-cols-3 rounded-2xl bg-surface-3 p-1">
              {MODES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={mode === option.value}
                  onClick={() => setMode(option.value)}
                  className={cn(
                    "flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-semibold transition",
                    mode === option.value
                      ? "bg-surface text-content shadow-sm"
                      : "text-content-muted hover:text-content"
                  )}
                >
                  <option.icon size={16} aria-hidden className="shrink-0" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label">Accent color</p>
            <div role="group" aria-label="Accent color" className="grid max-w-md grid-cols-4 gap-x-2 gap-y-3 p-1 sm:grid-cols-7">
              {ACCENT_PRESETS.map((preset) => {
                const isActive = accent === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setAccent(preset.name)}
                    aria-label={preset.label}
                    aria-pressed={isActive}
                    className={cn(
                      "flex min-h-11 min-w-0 flex-col items-center gap-2 rounded-xl py-1 text-xs transition",
                      isActive
                        ? "font-bold text-content"
                        : "text-content-muted hover:text-content"
                    )}
                  >
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-full border-[3px]", isActive ? "border-content" : "border-transparent")} style={{ background: preset.hex }}>
                    {isActive ? (
                      <Check className="h-5 w-5 text-white drop-shadow stroke-[3]" />
                    ) : null}
                    </span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      <TrackingPreferences />

      <SectionCard
        title="How Pulse works"
        description="Replay the quick tour of habits, XP, badges, streak freezes and repairs."
      >
        <Button
          type="button"
          variant="secondary"
          onClick={() => openWalkthrough(0)}
          className="font-bold"
        >
          <Compass className="mr-2 h-4 w-4" aria-hidden />
          How Pulse works
        </Button>
      </SectionCard>

      <SectionCard title="Account" description="Details tied to your login.">
        <div className="mb-5">
          <p className="field-label">Profile photo</p>
          <AvatarUploader size="md" className="mt-2" />
        </div>
        <div>
          <p className="field-label">Email</p>
          <p className="break-words rounded-2xl bg-surface-2 px-4 py-3 text-sm font-medium text-content-2">
            {user?.email ?? "—"}
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Session">
        <Button type="button" variant="danger" onClick={handleLogout}>
          Sign out
        </Button>
      </SectionCard>

      <SectionCard
        title="Delete account"
        description="Permanently removes your account and all of its data. This cannot be undone."
      >
        <form onSubmit={handleDeleteAccount} className="space-y-3">
          <label htmlFor="delete-password" className="field-label">
            Current password
          </label>
          <Input
            id="delete-password"
            type="password"
            autoComplete="current-password"
            required
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
          {deleteError ? (
            <p role="alert" className="text-sm font-medium text-rose-600">
              {deleteError}
            </p>
          ) : null}
          <Button type="submit" variant="danger" disabled={isDeletingAccount}>
            {isDeletingAccount ? "Deleting…" : "Delete account"}
          </Button>
        </form>
      </SectionCard>
    </div>
  );
};
