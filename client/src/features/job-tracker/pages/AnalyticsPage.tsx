import { useJobTrackerStore } from "../stores/jobTrackerStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Percent,
  Clock,
  Briefcase,
  Share2,
  Calendar
} from "lucide-react";

export const AnalyticsPage = () => {
  const applications = useJobTrackerStore((s) => s.applications);
  const referrals = useJobTrackerStore((s) => s.referrals);
  const dailyTasks = useJobTrackerStore((s) => s.dailyTasks);

  // Conversion Funnel Calculations
  const totalApps = applications.filter((a) => a.status !== "Wishlist").length;
  
  const hrCallCount = applications.filter((a) =>
    ["HR Call", "OA", "Interview 1", "Interview 2", "Final Round", "Offer", "Rejected"].includes(a.status)
  ).length;

  const oaCount = applications.filter((a) =>
    ["OA", "Interview 1", "Interview 2", "Final Round", "Offer", "Rejected"].includes(a.status)
  ).length;

  const interviewCount = applications.filter((a) =>
    ["Interview 1", "Interview 2", "Final Round", "Offer", "Rejected"].includes(a.status)
  ).length;

  const offerCount = applications.filter((a) => a.status === "Offer").length;

  const getPercent = (count: number, base: number) => {
    if (base === 0) return 0;
    return Math.round((count / base) * 100);
  };

  const funnelData = [
    { stage: "Applications", count: totalApps, percentage: 100, fill: "#6366f1" },
    { stage: "HR Screens", count: hrCallCount, percentage: getPercent(hrCallCount, totalApps), fill: "#8b5cf6" },
    { stage: "OA Invites", count: oaCount, percentage: getPercent(oaCount, totalApps), fill: "#06b6d4" },
    { stage: "Interviews", count: interviewCount, percentage: getPercent(interviewCount, totalApps), fill: "#10b981" },
    { stage: "Offers", count: offerCount, percentage: getPercent(offerCount, totalApps), fill: "#f59e0b" }
  ];

  // Referral Success Ratio
  const totalRefs = referrals.length;
  const repliedRefs = referrals.filter((r) => r.replied).length;
  const referralSuccessRate = getPercent(repliedRefs, totalRefs);

  // Productivity Score (arbitrary metric combining tasks completed + applications + referrals)
  const completedTasks = dailyTasks.filter((t) => t.completed).length;
  const totalTasks = dailyTasks.length;
  const tasksScore = getPercent(completedTasks, totalTasks);
  
  const productivityScore = Math.min(
    100,
    Math.round((tasksScore * 0.4) + (totalApps * 3) + (repliedRefs * 5))
  );

  // Success Rates by Job Portal (Hardcoded representation for layout completeness)
  const portalPerformance = [
    { name: "LinkedIn Referral", success: 65, fill: "#6366f1" },
    { name: "Naukri direct", success: 18, fill: "#f43f5e" },
    { name: "Wellfound (AngelList)", success: 42, fill: "#10b981" },
    { name: "Instahyre", success: 38, fill: "#f59e0b" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-app/40 pb-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-accent" />
            Analytics &amp; Pipeline Funnels
          </h1>
          <p className="text-xs text-content-muted mt-1">Review conversion metrics, success rates, and portal performance</p>
        </div>
      </section>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="surface-card p-5 space-y-3">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Application conversion</span>
            <Percent className="h-4 w-4 text-accent" />
          </div>
          <p className="text-2xl font-extrabold">{getPercent(offerCount, totalApps)}%</p>
          <p className="text-xs text-content-2">Total offers / Total applications submitted</p>
        </div>

        {/* Card 2 */}
        <div className="surface-card p-5 space-y-3">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Referral Reply Rate</span>
            <Share2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold">{referralSuccessRate}%</p>
          <p className="text-xs text-content-2">{repliedRefs} replies from {totalRefs} requested contacts</p>
        </div>

        {/* Card 3 */}
        <div className="surface-card p-5 space-y-3">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Response Time</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold">6 Days</p>
          <p className="text-xs text-content-2">Average time for recruiters to reply to submissions</p>
        </div>

        {/* Card 4 */}
        <div className="surface-card p-5 space-y-3">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Productivity Index</span>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold">{productivityScore} / 100</p>
          <p className="text-xs text-content-2">Combines daily preparation tasks, apps, and referrals</p>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Conversion Funnel */}
        <div className="surface-card p-6">
          <h2 className="text-base font-bold mb-4 border-b border-border-app/40 pb-3">Recruiting Pipeline Funnel</h2>
          <div className="space-y-4 py-2">
            {funnelData.map((stage) => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-content-2">{stage.stage}</span>
                  <span className="text-content font-bold">
                    {stage.count} ({stage.percentage}%)
                  </span>
                </div>
                <div className="h-4 w-full bg-surface-3 rounded-xl overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${stage.percentage}%`,
                      backgroundColor: stage.fill
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portal Performance Chart */}
        <div className="surface-card p-6">
          <h2 className="text-base font-bold mb-4 border-b border-border-app/40 pb-3">Portal Callback Success Rates</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={portalPerformance} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Callback Success"]}
                  contentStyle={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    color: "var(--text)"
                  }}
                />
                <Bar dataKey="success" radius={[0, 4, 4, 0]}>
                  {portalPerformance.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
