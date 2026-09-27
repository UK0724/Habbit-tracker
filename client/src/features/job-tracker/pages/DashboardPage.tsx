import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useJobTrackerStore } from "../stores/jobTrackerStore";
import { useAuthStore } from "../../../stores/authStore";
import { useHabits } from "../../habits/hooks/useHabits";
import { useSaveHabitLog } from "../../logs/hooks/useHabitLogs";
import {
  Briefcase,
  Users,
  MessageSquare,
  Video,
  FileCheck,
  Ban,
  CheckCircle2,
  Calendar,
  Flame,
  Award
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ContributionGrid } from "../../../components/viz/ContributionGrid";
import type { DayCell } from "../../stats/lib/analytics";

export const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);

  const applications = useJobTrackerStore((s) => s.applications);
  const referrals = useJobTrackerStore((s) => s.referrals);
  const dailyTasks = useJobTrackerStore((s) => s.dailyTasks);
  const toggleTask = useJobTrackerStore((s) => s.toggleTask);
  const weeklyGoals = useJobTrackerStore((s) => s.weeklyGoals);
  const updateWeeklyGoals = useJobTrackerStore((s) => s.updateWeeklyGoals);

  const todayStr = new Date().toISOString().split("T")[0] || "";
  const { data: habits } = useHabits(todayStr);
  const { mutate: saveLog } = useSaveHabitLog();

  const linkedHabit = habits?.find((h) => h.linkToJobTracker);
  const activeStreak = linkedHabit
    ? linkedHabit.stats.type === "action"
      ? linkedHabit.stats.currentStreak
      : 0
    : 0;

  // Sync completion checklist state with linked habit streak
  useEffect(() => {
    if (!habits || !dailyTasks) return;
    const todayName = (() => {
      const daysMap = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ];
      return daysMap[new Date().getDay()] || "Monday";
    })();
    const todayTasks = dailyTasks.filter((t) => t.dayOfWeek === todayName);
    if (todayTasks.length === 0) return;

    const allDone = todayTasks.every((t) => t.completed);
    const jobHabit = habits.find((h) => h.linkToJobTracker);

    if (jobHabit) {
      const isCurrentlyDone = jobHabit.selectedDateLog?.status === "done";
      if (allDone && !isCurrentlyDone) {
        saveLog({
          habitId: jobHabit.id,
          logId: jobHabit.selectedDateLog?.id,
          input: {
            date: todayStr,
            status: "done",
            comment: `Completed all checklist tasks for ${todayName}`
          }
        });
      } else if (
        !allDone &&
        isCurrentlyDone &&
        jobHabit.selectedDateLog?.comment?.includes(
          "Completed all checklist tasks"
        )
      ) {
        saveLog({
          habitId: jobHabit.id,
          logId: jobHabit.selectedDateLog?.id,
          input: {
            date: todayStr,
            status: "not_done",
            comment: ""
          }
        });
      }
    }
  }, [dailyTasks, habits, todayStr, saveLog]);

  // Compute counts
  const appsSentCount = applications.filter(
    (a) => a.status !== "Wishlist"
  ).length;
  const referralsRequested = referrals.length;
  const recruiterReplies = referrals.filter((r) => r.replied).length;
  const interviewsCount = applications.filter((a) =>
    ["Interview 1", "Interview 2", "Final Round"].includes(a.status)
  ).length;
  const oaCount = applications.filter((a) => a.status === "OA").length;
  const rejectionsCount = applications.filter(
    (a) => a.status === "Rejected"
  ).length;
  const offersCount = applications.filter((a) => a.status === "Offer").length;

  // Streak/Checklist completion
  const todayDayName = (() => {
    const daysMap = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];
    return daysMap[new Date().getDay()] || "Monday";
  })();
  const todayTasks = dailyTasks.filter((t) => t.dayOfWeek === todayDayName);

  // Weekly Target Calculation
  const completionPercent = Math.round(
    ((weeklyGoals.appsCurrent + weeklyGoals.referralsCurrent) /
      (weeklyGoals.appsTarget + weeklyGoals.referralsTarget)) *
      100
  );

  // Chart Data: Applications per Week (last 4 weeks dynamically)
  const getAppsForPastWeek = (
    weeksAgo: number
  ): { apps: number; interviews: number } => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - (weeksAgo + 1) * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setDate(today.getDate() - weeksAgo * 7);
    end.setHours(23, 59, 59, 999);

    const appsInWeek = applications.filter((app) => {
      if (app.status === "Wishlist" || !app.appliedDate) return false;
      const appDate = new Date(app.appliedDate);
      return appDate >= start && appDate <= end;
    });

    const interviewsInWeek = appsInWeek.filter((app) =>
      ["Interview 1", "Interview 2", "Final Round"].includes(app.status)
    ).length;

    return { apps: appsInWeek.length, interviews: interviewsInWeek };
  };

  const appPerWeekData = [
    { name: "3w Ago", ...getAppsForPastWeek(3) },
    { name: "2w Ago", ...getAppsForPastWeek(2) },
    { name: "1w Ago", ...getAppsForPastWeek(1) },
    { name: "This Week", ...getAppsForPastWeek(0) }
  ];

  // Chart Data: Applications by Company
  const companyDataMap: Record<string, number> = {};
  applications.forEach((app) => {
    companyDataMap[app.company] = (companyDataMap[app.company] || 0) + 1;
  });
  const appByCompanyData = Object.entries(companyDataMap)
    .map(([name, value]) => ({ name, value }))
    .slice(0, 5); // top 5

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

  // Heatmap generation
  const generateHeatmapColumns = (): DayCell[][] => {
    const columns: DayCell[][] = [];
    const today = new Date();
    // 12 columns (weeks)
    for (let w = 11; w >= 0; w--) {
      const col: DayCell[] = [];
      // 7 days per week
      for (let d = 6; d >= 0; d--) {
        const dateObj = new Date();
        dateObj.setDate(today.getDate() - (w * 7 + d));
        const dateString = dateObj.toISOString().split("T")[0] || "";

        // Count activity (applications or referrals sent on this date)
        const appsOnDate = applications.filter(
          (a) => a.appliedDate === dateString
        ).length;
        const refsOnDate = referrals.filter(
          (r) => r.dateSent === dateString
        ).length;
        const hasLog = appsOnDate > 0 || refsOnDate > 0;

        col.push({
          date: dateString,
          hasLog,
          status: hasLog ? "done" : "not_done",
          value: appsOnDate + refsOnDate
        });
      }
      columns.push(col);
    }
    return columns;
  };

  const heatmapColumns = generateHeatmapColumns();

  // Handle study goal increment
  const handleAddStudyHour = () => {
    updateWeeklyGoals({
      studyHoursCurrent: Math.min(
        weeklyGoals.studyHoursTarget,
        weeklyGoals.studyHoursCurrent + 0.5
      )
    });
  };

  // Handle study goal decrement
  const handleSubtractStudyHour = () => {
    updateWeeklyGoals({
      studyHoursCurrent: Math.max(0, weeklyGoals.studyHoursCurrent - 0.5)
    });
  };

  // Profile greeting details
  const nameLabel = user?.email?.split("@")[0] || "Uday";
  const capitalizedName =
    nameLabel.charAt(0).toUpperCase() + nameLabel.slice(1);

  return (
    <div className="space-y-6">
      {/* Hero Welcome banner */}
      <section className="surface-card relative overflow-hidden p-6 sm:p-8 animate-fade-in-up">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-accent/10 via-accent/10 to-transparent" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
              Good Evening, {capitalizedName} 👋
            </h1>
            <p className="mt-2 text-sm text-content-2 max-w-xl">
              Your job search pipeline is looking healthy. You have a final
              round interview coming up soon and 1 pending offer details.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-2xl bg-surface-2 px-4 py-3 border border-border-app/40 flex items-center gap-2.5">
              <Flame className="h-6 w-6 text-amber-500 animate-flame" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
                  Current Streak
                </p>
                <p className="text-lg font-extrabold text-amber-500">
                  {activeStreak} Days
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-surface-2 px-4 py-3 border border-border-app/40 flex items-center gap-2.5">
              <Award className="h-6 w-6 text-emerald-500" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
                  Completion
                </p>
                <p className="text-lg font-extrabold text-emerald-500">
                  {completionPercent}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Plan and Weekly Goals */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Plan Checklist */}
        <div className="surface-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border-app/50 pb-3 mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-accent" />
                Today's Plan ({todayDayName})
              </h2>
              <span className="text-xs font-semibold text-content-muted">
                {todayTasks.filter((t) => t.completed).length} of{" "}
                {todayTasks.length} done
              </span>
            </div>
            <div className="space-y-2">
              {todayTasks.length > 0 ? (
                todayTasks.map((task) => (
                  <label
                    key={task.id}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 transition cursor-pointer ${
                      task.completed
                        ? "bg-surface-2 border-border-app/40 text-content-muted line-through"
                        : "bg-surface-2/40 border-border-app/60 hover:bg-surface-3"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="h-4.5 w-4.5 rounded border-border-app text-accent focus:ring-accent"
                    />
                    <span className="text-sm font-semibold">{task.text}</span>
                  </label>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-content-muted">
                  No tasks set for today.
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-app/40 text-right">
            <Link
              to="/job-tracker/planner"
              className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1"
            >
              Configure Planner &rarr;
            </Link>
          </div>
        </div>

        {/* Weekly Goals Progress */}
        <div className="surface-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border-app/50 pb-3 mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-accent" />
                Weekly Progress Goals
              </h2>
            </div>
            <div className="space-y-4">
              {/* Applications Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-content-2">Applications Sent</span>
                  <span className="text-content font-bold">
                    {weeklyGoals.appsCurrent} / {weeklyGoals.appsTarget}
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (weeklyGoals.appsCurrent / weeklyGoals.appsTarget) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Referrals Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-content-2">Referrals Sent</span>
                  <span className="text-content font-bold">
                    {weeklyGoals.referralsCurrent} /{" "}
                    {weeklyGoals.referralsTarget}
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (weeklyGoals.referralsCurrent / weeklyGoals.referralsTarget) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Study Hours Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-content-2">Study Hours</span>
                  <span className="text-content font-bold">
                    {weeklyGoals.studyHoursCurrent} /{" "}
                    {weeklyGoals.studyHoursTarget} hrs
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (weeklyGoals.studyHoursCurrent / weeklyGoals.studyHoursTarget) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* LinkedIn Posts Progress */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-content-2">LinkedIn Posts</span>
                  <span className="text-content font-bold">
                    {weeklyGoals.linkedinCurrent} / {weeklyGoals.linkedinTarget}
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (weeklyGoals.linkedinCurrent / weeklyGoals.linkedinTarget) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-app/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubtractStudyHour}
                disabled={weeklyGoals.studyHoursCurrent <= 0}
                className="text-xs font-bold text-rose-500 hover:underline inline-flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
              >
                -0.5h Study Hour
              </button>
              <span className="text-content-muted">/</span>
              <button
                onClick={handleAddStudyHour}
                className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1"
              >
                +0.5h Study Hour
              </button>
            </div>
            <span className="text-[10px] text-content-muted">
              Target changes reset weekly
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {[
          {
            label: "Sent",
            value: appsSentCount,
            icon: Briefcase,
            color: "text-accent bg-accent/10"
          },
          {
            label: "Referrals",
            value: referralsRequested,
            icon: Users,
            color: "text-emerald-500 bg-emerald-500/10"
          },
          {
            label: "Replies",
            value: recruiterReplies,
            icon: MessageSquare,
            color: "text-amber-500 bg-amber-500/10"
          },
          {
            label: "Interviews",
            value: interviewsCount,
            icon: Video,
            color: "text-indigo-400 bg-indigo-400/10"
          },
          {
            label: "OAs",
            value: oaCount,
            icon: FileCheck,
            color: "text-cyan-400 bg-cyan-400/10"
          },
          {
            label: "Rejections",
            value: rejectionsCount,
            icon: Ban,
            color: "text-rose-500 bg-rose-500/10"
          },
          {
            label: "Offers",
            value: offersCount,
            icon: CheckCircle2,
            color: "text-emerald-400 bg-emerald-400/10"
          }
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="surface-card p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
                {kpi.label}
              </span>
              <span className={`rounded-lg p-1.5 ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Heatmap Section */}
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-4 border-b border-border-app/40 pb-3">
          <div>
            <h2 className="text-base font-bold">Daily Activity Heatmap</h2>
            <p className="text-xs text-content-muted mt-0.5">
              Aggregates applications submitted and referrals requested over the
              last 12 weeks
            </p>
          </div>
          <span className="text-xs font-bold text-accent">Active tracking</span>
        </div>
        <div className="flex items-center justify-center py-2 overflow-x-auto">
          <ContributionGrid
            columns={heatmapColumns}
            mode="measurable"
            baseColor="#6366f1"
            maxValue={3}
            className="w-full justify-center"
          />
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Chart */}
        <div className="surface-card p-6">
          <h2 className="text-base font-bold mb-4 border-b border-border-app/40 pb-3">
            Applications per Week
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={appPerWeekData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    color: "var(--text)"
                  }}
                />
                <Bar
                  dataKey="apps"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  name="Applications"
                />
                <Bar
                  dataKey="interviews"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Interviews"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company Distribution Chart */}
        <div className="surface-card p-6">
          <h2 className="text-base font-bold mb-4 border-b border-border-app/40 pb-3">
            Applications by Company
          </h2>
          <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="h-full w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appByCompanyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {appByCompanyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              {appByCompanyData.map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-semibold truncate max-w-[120px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-content-muted">
                    {item.value} applications
                  </span>
                </div>
              ))}
              {appByCompanyData.length === 0 && (
                <p className="text-center text-content-muted py-8">
                  No applications to show.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
