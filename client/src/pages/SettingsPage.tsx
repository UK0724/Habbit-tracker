import { TrackingPreferences } from "../components/TrackingPreferences";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { ACCENT_PRESETS, ThemeMode } from "../shared/lib/theme";
import { cn } from "../shared/lib/utils";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";

const MODES: { value: ThemeMode; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "☀︎" },
  { value: "dark", label: "Dark", hint: "☾" },
  { value: "system", label: "System", hint: "⚙︎" }
];

export const SettingsPage = () => {
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
    navigate("/login");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Settings"
        description="Personalize how the app looks. Changes apply instantly and are saved on this device."
      />

      <SectionCard
        title="Appearance"
        description="Choose a theme and an accent color."
      >
        <div className="space-y-6">
          <div>
            <p className="field-label">Theme</p>
            <div className="inline-flex w-full max-w-sm rounded-2xl bg-surface-3 p-1">
              {MODES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={mode === option.value}
                  onClick={() => setMode(option.value)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition",
                    mode === option.value
                      ? "bg-surface text-content shadow-sm"
                      : "text-content-muted hover:text-content"
                  )}
                >
                  <span aria-hidden>{option.hint}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label">Accent color</p>
            <div className="flex flex-wrap gap-3">
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
                      "flex h-11 w-11 items-center justify-center rounded-2xl ring-2 ring-offset-2 ring-offset-surface transition",
                      isActive
                        ? "ring-content scale-105"
                        : "ring-transparent hover:scale-105"
                    )}
                    style={{ background: preset.hex }}
                  >
                    {isActive ? (
                      <span className="text-lg font-bold text-white drop-shadow">
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      <TrackingPreferences/>
      <SectionCard title="Account" description="Details tied to your login.">
        <div>
          <p className="field-label">Email</p>
          <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm font-medium text-content-2">
            {user?.email ?? "—"}
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Session">
        <Button type="button" variant="danger" onClick={handleLogout}>
          Sign out
        </Button>
      </SectionCard>
    </div>
  );
};
