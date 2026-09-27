import { useState } from "react";
import { useJobTrackerStore } from "../stores/jobTrackerStore";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export const CalendarPage = () => {
  const applications = useJobTrackerStore((s) => s.applications);
  const referrals = useJobTrackerStore((s) => s.referrals);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Date math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...

  const calendarCells: { dayNum: number | null; dateString: string | null }[] =
    [];

  // Padding cells for previous month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ dayNum: null, dateString: null });
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  // Active days cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateString = `${currentYear}-${pad(currentMonth + 1)}-${pad(d)}`;
    calendarCells.push({ dayNum: d, dateString });
  }

  // Helper to filter events on a day
  const getEventsForDate = (dateStr: string) => {
    const events: {
      type: "apply" | "referral" | "interview" | "oa";
      label: string;
    }[] = [];

    // Applications submitted on this date
    applications.forEach((app) => {
      if (app.appliedDate === dateStr && app.status !== "Wishlist") {
        events.push({ type: "apply", label: `Applied: ${app.company}` });
      }
      // Interviews or OAs scheduled (just mapping using dates/comments or status for presentation)
      if (
        app.appliedDate === dateStr &&
        ["Interview 1", "Interview 2", "Final Round"].includes(app.status)
      ) {
        events.push({ type: "interview", label: `Interview: ${app.company}` });
      }
      if (app.appliedDate === dateStr && app.status === "OA") {
        events.push({ type: "oa", label: `OA: ${app.company}` });
      }
    });

    // Referrals requested/follow-ups
    referrals.forEach((ref) => {
      if (ref.dateSent === dateStr) {
        events.push({
          type: "referral",
          label: `Referral sent: ${ref.company}`
        });
      }
      if (ref.followUpDate === dateStr && !ref.replied) {
        events.push({
          type: "referral",
          label: `Follow-up: ${ref.personName} (${ref.company})`
        });
      }
    });

    return events;
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-app/40 pb-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-accent" />
            Calendar Workspace
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Review deadlines, schedule events, and check status history
          </p>
        </div>

        {/* Date Selector Header */}
        <div className="flex items-center gap-3 bg-surface border border-border-app rounded-xl p-1.5 self-start">
          <button
            onClick={handlePrevMonth}
            className="rounded-lg p-1.5 hover:bg-surface-2 text-content-muted hover:text-content"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-extrabold text-content min-w-[100px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="rounded-lg p-1.5 hover:bg-surface-2 text-content-muted hover:text-content"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Legend */}
      <section className="flex flex-wrap gap-4 text-xs font-semibold text-content-muted px-1.5">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Applications
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Referrals
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> OAs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" /> Interviews
        </span>
      </section>

      {/* Month Grid */}
      <div className="surface-card p-3">
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-content-muted uppercase tracking-wider mb-2 border-b border-border-app/40 pb-2">
          {weekdays.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 min-h-[45vh]">
          {calendarCells.map((cell, index) => {
            const hasDay = cell.dayNum !== null;
            const events = cell.dateString
              ? getEventsForDate(cell.dateString)
              : [];
            const isTodayDate =
              cell.dateString === today.toISOString().split("T")[0];

            return (
              <div
                key={index}
                className={`rounded-xl border p-2 flex flex-col justify-between min-h-[70px] ${
                  hasDay
                    ? isTodayDate
                      ? "bg-accent/5 border-accent shadow-sm"
                      : "bg-surface-2/30 border-border-app/50 hover:bg-surface-2/65 transition"
                    : "bg-transparent border-transparent"
                }`}
              >
                {hasDay && (
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-bold ${
                        isTodayDate
                          ? "text-accent text-sm font-black"
                          : "text-content-muted"
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                  </div>
                )}

                {/* Day events indicator */}
                {hasDay && events.length > 0 && (
                  <div className="mt-2 space-y-1 overflow-hidden">
                    {events.slice(0, 3).map((ev, idx) => {
                      const color =
                        ev.type === "apply"
                          ? "bg-accent/15 border-accent/30 text-accent"
                          : ev.type === "referral"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600"
                            : ev.type === "oa"
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-600"
                              : "bg-indigo-400/15 border-indigo-400/30 text-indigo-400";

                      return (
                        <div
                          key={idx}
                          title={ev.label}
                          className={`rounded border px-1.5 py-0.5 text-[8px] font-bold truncate leading-tight ${color}`}
                        >
                          {ev.label}
                        </div>
                      );
                    })}
                    {events.length > 3 && (
                      <p className="text-[7px] font-extrabold text-content-muted pl-1">
                        + {events.length - 3} more...
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
