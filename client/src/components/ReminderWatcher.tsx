import { useEffect } from "react";
import { useHabits } from "../features/habits/hooks/useHabits";
import { getTodayDateString } from "../shared/lib/date";
import { scheduled } from "../shared/lib/rules";
import { useAuthStore } from "../stores/authStore";
export const ReminderWatcher = () => {
  const query = useHabits(getTodayDateString());
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        localStorage.getItem("arc-reminders") !== "on" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      )
        return;
      const time = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone:
          localStorage.getItem("pulse-timezone") ||
          localStorage.getItem("arc-timezone") ||
          Intl.DateTimeFormat().resolvedOptions().timeZone
      }).format(new Date());
      for (const habit of query.data ?? []) {
        const key = `arc-reminded-${user?.id}-${habit.id}-${getTodayDateString()}`;
        if (
          habit.reminderTime === time &&
          scheduled(habit, getTodayDateString()) &&
          !habit.selectedDateLog &&
          !localStorage.getItem(key)
        ) {
          new Notification(habit.title, {
            body: "Your check-in is ready in Pulse."
          });
          localStorage.setItem(key, "1");
        }
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [query.data, user?.id]);
  return null;
};
