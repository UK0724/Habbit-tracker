import { useState } from "react";
import { useJobTrackerStore } from "../stores/jobTrackerStore";
import { DailyTask } from "../types";
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Flame,
  RefreshCw,
  Info
} from "lucide-react";
import { useHabits } from "../../habits/hooks/useHabits";


export const PlannerPage = () => {
  const dailyTasks = useJobTrackerStore((s) => s.dailyTasks);
  const addTask = useJobTrackerStore((s) => s.addTask);
  const toggleTask = useJobTrackerStore((s) => s.toggleTask);
  const deleteTask = useJobTrackerStore((s) => s.deleteTask);
  const preloadDayTasks = useJobTrackerStore((s) => s.preloadDayTasks);

  const todayStr = new Date().toISOString().split("T")[0] || "";
  const { data: habits } = useHabits(todayStr);


  const linkedHabit = habits?.find((h) => h.linkToJobTracker);
  const activeStreak = linkedHabit
    ? linkedHabit.stats.type === "action"
      ? linkedHabit.stats.currentStreak
      : 0
    : 0;

  const getTodayDayName = (): DailyTask["dayOfWeek"] => {
    const daysMap: DailyTask["dayOfWeek"][] = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];
    return daysMap[new Date().getDay()] || "Wednesday";
  };

  const [selectedDay, setSelectedDay] = useState<DailyTask["dayOfWeek"]>(getTodayDayName());
  const [newTaskText, setNewTaskText] = useState("");

  const days: DailyTask["dayOfWeek"][] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const currentDayTasks = dailyTasks.filter((t) => t.dayOfWeek === selectedDay);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    addTask(newTaskText.trim(), selectedDay);
    setNewTaskText("");
  };

  const handlePreload = () => {
    if (confirm(`Would you like to reset ${selectedDay}'s checklist to its default schedule? This will overwrite active custom items.`)) {
      preloadDayTasks(selectedDay);
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-app/40 pb-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-accent" />
            Daily Planner
          </h1>
          <p className="text-xs text-content-muted mt-1">Organize your preparation and checklist items day by day</p>
        </div>
        
        {/* Streak (Read-only, linked to main page) */}
        <div className="flex items-center gap-2 rounded-2xl bg-surface border border-border-app p-2 px-3">
          <Flame className="h-5 w-5 text-amber-500 animate-flame shrink-0" />
          <span className="text-xs font-extrabold text-content-2">Job Search Streak:</span>
          <span className="text-sm font-extrabold text-amber-500">{activeStreak} Days</span>
        </div>
      </section>

      {/* Week Day Toggles */}
      <section className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {days.map((day) => {
          const dayTasksCount = dailyTasks.filter(t => t.dayOfWeek === day).length;
          const completedCount = dailyTasks.filter(t => t.dayOfWeek === day && t.completed).length;
          const active = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`rounded-2xl border px-4 py-3 shrink-0 text-left transition flex items-center gap-3 ${
                active
                  ? "bg-accent border-accent text-accent-fg shadow-sm"
                  : "bg-surface border-border-app/50 hover:border-accent/40 text-content-2"
              }`}
            >
              <div>
                <p className="text-xs font-extrabold">{day}</p>
                <p className={`text-[10px] mt-0.5 font-bold ${active ? "text-white/80" : "text-content-muted"}`}>
                  {completedCount} / {dayTasksCount} done
                </p>
              </div>
            </button>
          );
        })}
      </section>

      {/* Grid: Checklist and schedule reference */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Checklist Container */}
        <div className="surface-card p-6 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border-app/40 pb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-accent" />
              {selectedDay}'s Checklist
            </h2>
            <button
              onClick={handlePreload}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1.5"
              title="Preload schedule defaults"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Preload Defaults
            </button>
          </div>

          {/* Add custom checklist task */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a new custom task for today..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1 rounded-xl border border-border-app bg-surface-2/40 px-4 py-2 text-sm text-content outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>

          {/* Checklist items list */}
          <div className="space-y-2 mt-4">
            {currentDayTasks.length > 0 ? (
              currentDayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                    task.completed
                      ? "bg-surface-2/40 border-border-app/30 text-content-muted"
                      : "bg-surface-2/70 border-border-app/60"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="h-4.5 w-4.5 rounded border-border-app text-accent focus:ring-accent"
                    />
                    <span className={`text-sm font-semibold ${task.completed ? "line-through" : ""}`}>
                      {task.text}
                    </span>
                  </label>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 hover:text-rose-500 rounded text-content-subtle"
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-sm text-content-muted border border-dashed rounded-xl">
                No tasks set for {selectedDay}. Click "Preload Defaults" above to load preset tasks.
              </div>
            )}
          </div>
        </div>

        {/* Schedule guide */}
        <div className="space-y-6">
          <div className="surface-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
              <Info className="h-4 w-4" /> Recommended Weekly Schedule
            </h3>
            <p className="text-xs text-content-muted leading-relaxed">
              This layout comes preloaded with a target-focused agenda designed to keep your preparation structured:
            </p>
            <div className="space-y-2.5 text-[11px] font-semibold text-content-2">
              <div className="flex justify-between border-b pb-1.5 border-border-app/40">
                <span className="text-content">Monday</span>
                <span>React Prep &amp; Referrals</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border-app/40">
                <span className="text-content">Tuesday</span>
                <span>Angular Prep &amp; Signals</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border-app/40">
                <span className="text-content">Wednesday</span>
                <span>JS Revision &amp; Networking</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border-app/40">
                <span className="text-content">Thursday</span>
                <span>System Design &amp; Follow-ups</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border-app/40">
                <span className="text-content">Friday</span>
                <span>Machine Coding &amp; Portfolio</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border-app/40">
                <span className="text-content">Saturday</span>
                <span>Resumes &amp; Mock Interviews</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-content">Sunday</span>
                <span>Weekly review &amp; STAR Prep</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
