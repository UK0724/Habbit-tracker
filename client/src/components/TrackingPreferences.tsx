import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../services/api";
import { Button } from "./ui/Button";
import { SectionCard } from "./ui/SectionCard";
import { useHomeDateStore } from "../features/habits/hooks/useHomeDateStore";

export const TrackingPreferences = () => {
  const [draftZone, setDraftZone] = useState<string | null>(null);
  const [zoneMessage, setZoneMessage] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [busy, setBusy] = useState<"zone" | "export" | null>(null);
  const cache = useQueryClient();
  const { data: preferences, isLoading, isError, refetch } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => apiRequest<{ timezone: string }>("/preferences")
  });
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zone = draftZone ?? preferences?.timezone ?? "";
  const supported = (Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") ??
    ["Asia/Kolkata", "Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Singapore", "Australia/Sydney"];
  const zones = [...new Set(["UTC", deviceZone, zone, ...supported].filter(Boolean))].sort();

  const saveZone = async () => {
    setBusy("zone");
    try {
      setZoneMessage("");
      await apiRequest("/preferences", {
        method: "PATCH",
        body: JSON.stringify({ timezone: zone })
      });
      cache.setQueryData(["preferences"], { timezone: zone });
      localStorage.setItem("pulse-timezone", zone);
      useHomeDateStore.getState().resetSelectedDate();
      await cache.invalidateQueries();
      setZoneMessage(
        "Timezone saved across your devices. Existing dates are unchanged."
      );
    } catch (e) {
      setZoneMessage(e instanceof Error ? e.message : "Could not save timezone.");
    } finally {
      setBusy(null);
    }
  };

  const download = async () => {
    setBusy("export");
    setExportMessage("");
    try {
      const data = await apiRequest("/export");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `pulse-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportMessage("Export downloaded successfully.");
    } catch (e) {
      setExportMessage(
        e instanceof Error ? e.message : "Could not export. Try again."
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Timezone"
        description="Your timezone syncs across devices. A day ends at midnight in this timezone; weeks end on Sunday."
      >
        <label className="field-label" htmlFor="timezone">
          Timezone
        </label>
        <select
          id="timezone"
          className="field-input min-h-12 min-w-0 max-w-full"
          value={zone}
          disabled={isLoading || isError || busy === "zone"}
          onChange={(event) => { setDraftZone(event.target.value); setZoneMessage(""); }}
          aria-describedby="device-timezone"
        >
          {!zone && <option value="">{isLoading ? "Loading timezone…" : "Choose a timezone"}</option>}
          {zones.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
        </select>
        <p id="device-timezone" className="mt-2 break-words text-xs text-content-muted">Device timezone: {deviceZone.replaceAll("_", " ")}</p>
        {isError && <p role="alert" className="mt-2 text-sm text-content-2">Could not load your saved timezone. <button type="button" className="min-h-11 text-accent underline" onClick={() => void refetch()}>Try again</button></p>}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" disabled={busy !== null || !zone || isLoading || isError || zone === preferences?.timezone} onClick={() => void saveZone()}>
            {busy === "zone" ? "Saving…" : "Save timezone"}
          </Button>
          <Button type="button" variant="secondary" disabled={busy !== null || isLoading || isError || zone === deviceZone}
            onClick={() => { setDraftZone(deviceZone); setZoneMessage("Device timezone selected. Save to apply it across your devices."); }}>
            Use device timezone
          </Button>
        </div>
        {zoneMessage && <p role="status" className="mt-3 text-sm text-content-2">{zoneMessage}</p>}
      </SectionCard>

      <SectionCard
        title="Data Backup & Export"
        description="Habits, check-ins, streaks, and expenses sync seamlessly with your Pulse account. You can export a full JSON snapshot anytime."
      >
        <Button className="w-full sm:w-auto whitespace-normal" disabled={busy !== null} onClick={() => void download()}>
          {busy === "export" ? "Exporting…" : "Export all tracking data (JSON)"}
        </Button>
        <p className="mt-3 text-xs text-content-muted">
          Includes active habits, archived habits, streaks, and complete logged
          history.
        </p>
      </SectionCard>

      {exportMessage && (
        <div
          role="status"
          className="rounded-xl border border-accent/20 bg-surface-2 p-4 text-sm font-medium text-content shadow-sm"
        >
          {exportMessage}
        </div>
      )}
    </div>
  );
};
