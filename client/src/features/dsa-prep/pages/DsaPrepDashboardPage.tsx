import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDsaPrepStore } from "../stores/dsaPrepStore";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Search, Filter, CheckCircle2, Circle } from "lucide-react";
import { useHabits } from "../../habits/hooks/useHabits";
import { useSaveHabitLog } from "../../logs/hooks/useHabitLogs";

export const DsaPrepDashboardPage = () => {
  const solvedProblems = useDsaPrepStore((s) => s.solvedProblems);
  const problems = useDsaPrepStore((s) => s.problems);
  const fetchProblems = useDsaPrepStore((s) => s.fetchProblems);
  const isLoading = useDsaPrepStore((s) => s.isLoading);
  const solveProblem = useDsaPrepStore((s) => s.solveProblem);
  const unsolveProblem = useDsaPrepStore((s) => s.unsolveProblem);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0] || "", []);
  const habitsQuery = useHabits(todayStr);
  const saveLogMutation = useSaveHabitLog();

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [section, setSection] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const solvedSet = useMemo(() => {
    return new Set(solvedProblems.map((p) => p.problemId));
  }, [solvedProblems]);

  const handleToggleSolve = async (problemId: number, title: string) => {
    const isCurrentlySolved = solvedSet.has(problemId);
    try {
      if (isCurrentlySolved) {
        await unsolveProblem(problemId);
      } else {
        await solveProblem(problemId, "javascript", "");
        
        // Sync with linked DSA habit
        const dsaHabit = habitsQuery.data?.find((h) => h.linkToDSAPrep);
        if (dsaHabit && dsaHabit.selectedDateLog?.status !== "done") {
          await saveLogMutation.mutateAsync({
            habitId: dsaHabit.id,
            logId: dsaHabit.selectedDateLog?.id,
            input: {
              date: todayStr,
              status: "done",
              comment: `Solved Q${problemId}: ${title}`
            }
          });
        }
      }
    } catch (err) {
      console.error("Failed to toggle solve status:", err);
    }
  };

  // Extract unique sections
  const sections = useMemo(() => {
    const set = new Set(problems.map((p) => p.section));
    return Array.from(set);
  }, [problems]);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.pattern.toLowerCase().includes(search.toLowerCase());
      const matchDiff = difficulty === "all" || p.difficulty.toLowerCase() === difficulty.toLowerCase();
      const matchSec = section === "all" || p.section === section;
      
      const isSolved = solvedSet.has(p.id);
      const matchStatus = status === "all" || 
                          (status === "solved" && isSolved) || 
                          (status === "unsolved" && !isSolved);

      return matchSearch && matchDiff && matchSec && matchStatus;
    });
  }, [problems, search, difficulty, section, status, solvedSet]);

  const diffColors: Record<string, string> = {
    easy: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/20",
    medium: "text-amber-600 bg-amber-500/10 ring-amber-500/20",
    hard: "text-rose-600 bg-rose-500/10 ring-rose-500/20"
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="surface-card p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-violet-500/10 via-violet-500/10 to-transparent" />
        <div className="relative">
          <h1 className="font-display text-3xl font-bold tracking-tight text-content">DSA Preparation Challenge</h1>
          <p className="text-sm text-content-2 mt-1">Master 500 high-fidelity algorithmic questions to ace FAANG &amp; tier-1 interviews.</p>
        </div>
        <div className="relative shrink-0 flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 px-4 py-3 rounded-2xl">
          <div className="text-right">
            <p className="text-xs text-content-muted font-semibold uppercase tracking-wider">Solving Ratio</p>
            <p className="text-xl font-extrabold text-violet-600 dark:text-violet-400 mt-0.5">{solvedSet.size} / 500</p>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="surface-card p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problem titles or patterns..."
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="h-11 rounded-xl border border-border-app bg-surface px-3 py-2 text-sm font-semibold text-content-2 shadow-sm outline-none transition focus:border-accent"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="h-11 rounded-xl border border-border-app bg-surface px-3 py-2 text-sm font-semibold text-content-2 shadow-sm outline-none transition focus:border-accent max-w-[200px]"
            >
              <option value="all">All Sections</option>
              {sections.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 rounded-xl border border-border-app bg-surface px-3 py-2 text-sm font-semibold text-content-2 shadow-sm outline-none transition focus:border-accent"
            >
              <option value="all">All Status</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Unsolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Problems Table/Grid */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border-app bg-surface-2 text-xs font-bold uppercase tracking-wider text-content-muted">
                <th className="px-4 py-3.5 w-12 text-center">Status</th>
                <th className="px-4 py-3.5 w-16 text-center">ID</th>
                <th className="px-4 py-3.5">Title</th>
                <th className="px-4 py-3.5 w-24">Difficulty</th>
                <th className="px-4 py-3.5 hidden md:table-cell">Pattern</th>
                <th className="px-4 py-3.5 hidden lg:table-cell">Section</th>
                <th className="px-4 py-3.5 w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-app/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-content-muted">
                    Loading problem catalog...
                  </td>
                </tr>
              ) : filteredProblems.length > 0 ? (
                filteredProblems.map((prob) => {
                  const isSolved = solvedSet.has(prob.id);
                  return (
                    <tr key={prob.id} className="hover:bg-surface-2/40 transition">
                      <td className="px-4 py-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => handleToggleSolve(prob.id, prob.title)}
                          disabled={isLoading}
                          className="hover:scale-110 active:scale-95 transition cursor-pointer disabled:opacity-50 inline-flex items-center justify-center p-1 rounded-lg hover:bg-surface-3"
                          title={isSolved ? "Mark unsolved" : "Mark solved"}
                        >
                          {isSolved ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto fill-emerald-50" />
                          ) : (
                            <Circle className="h-5 w-5 text-content-muted mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-content-muted">
                        Q{prob.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-content">
                        <Link to={`/dsa-prep/${prob.id}`} className="hover:text-violet-600 transition">
                          {prob.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${diffColors[prob.difficulty.toLowerCase()] || ""}`}>
                          {prob.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-content-2 font-medium hidden md:table-cell">
                        {prob.pattern}
                      </td>
                      <td className="px-4 py-3 text-xs text-content-muted font-medium hidden lg:table-cell">
                        {prob.section}
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <Button asChild size="sm" variant="secondary">
                          <Link to={`/dsa-prep/${prob.id}`}>
                            Study
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-content-muted">
                    No matching DSA problems found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
