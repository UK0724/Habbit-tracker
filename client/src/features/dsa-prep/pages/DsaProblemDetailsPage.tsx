import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDsaPrepStore } from "../stores/dsaPrepStore";
import { dsaProblems } from "../data/dsaProblems";
import { AlgorithmVisualizer } from "../components/AlgorithmVisualizer";
import { useHabits } from "../../habits/hooks/useHabits";
import { useSaveHabitLog } from "../../logs/hooks/useHabitLogs";
import { Button } from "../../../components/ui/Button";
import { Confetti } from "../../../components/viz/Confetti";
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  Check,
  Code,
  BookOpen,
  LineChart
} from "lucide-react";

export const DsaProblemDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const problemId = Number(id);

  const problem = useMemo(() => {
    return dsaProblems.find((p) => p.id === problemId);
  }, [problemId]);

  const solvedProblems = useDsaPrepStore((s) => s.solvedProblems);
  const solveProblemMutation = useDsaPrepStore((s) => s.solveProblem);
  const isSolving = useDsaPrepStore((s) => s.isLoading);

  const [language, setLanguage] = useState<string>("python");
  const [copied, setCopied] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [activeTab, setActiveTab] = useState<"visualizer" | "naive" | "optimized">("visualizer");

  // Fetch habits to perform automatic log completions
  const todayStr = new Date().toISOString().split("T")[0] || "";
  const habitsQuery = useHabits(todayStr);
  const saveLogMutation = useSaveHabitLog();

  const isSolved = useMemo(() => {
    return solvedProblems.some((p) => p.problemId === problemId);
  }, [solvedProblems, problemId]);

  const solvedEntry = useMemo(() => {
    return solvedProblems.find((p) => p.problemId === problemId);
  }, [solvedProblems, problemId]);

  const [notes, setNotes] = useState(solvedEntry?.notes || "");

  if (!problem) {
    return (
      <div className="surface-card p-6 text-center text-rose-600">
        <p className="text-sm font-semibold">Problem Q{id} not found in preparation list.</p>
        <Button asChild className="mt-4" size="sm">
          <Link to="/dsa-prep">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const handleMarkSolved = async () => {
    try {
      // 1. Submit progress to backend database
      await solveProblemMutation(problemId, language, notes);
      
      // 2. Locate linked DSA habit and mark completed for today
      const dsaHabit = habitsQuery.data?.find((h) => h.linkToDSAPrep);
      if (dsaHabit && dsaHabit.selectedDateLog?.status !== "done") {
        await saveLogMutation.mutateAsync({
          habitId: dsaHabit.id,
          logId: dsaHabit.selectedDateLog?.id,
          input: {
            date: todayStr,
            status: "done",
            comment: `Solved Q${problem.id}: ${problem.title}`
          }
        });
      }

      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3000);
    } catch (err) {
      console.error("Failed to solve problem:", err);
    }
  };

  const codeString = activeTab === "naive"
    ? problem.naiveSolution.code[language] || ""
    : problem.optimizedSolution.code[language] || "";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diffColors: Record<string, string> = {
    easy: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/20",
    medium: "text-amber-600 bg-amber-500/10 ring-amber-500/20",
    hard: "text-rose-600 bg-rose-500/10 ring-rose-500/20"
  };

  return (
    <div className="space-y-6">
      {celebrate && <Confetti />}

      {/* Back button */}
      <div>
        <Link to="/dsa-prep" className="inline-flex items-center gap-1.5 text-sm font-semibold text-content-2 hover:text-content">
          <ArrowLeft className="h-4 w-4" />
          Back to Problem Catalog
        </Link>
      </div>

      {/* Hero header info */}
      <div className="surface-card p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-violet-500/10 via-violet-500/10 to-transparent" />
        <div className="relative">
          <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">Question {problem.id} — {problem.subSection}</span>
          <h1 className="font-display text-2xl font-extrabold text-content mt-1.5">{problem.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${diffColors[problem.difficulty.toLowerCase()] || ""}`}>
              {problem.difficulty}
            </span>
            <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold text-content-2 ring-1 ring-border-app">
              Pattern: {problem.pattern}
            </span>
            {isSolved && (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 ring-1 ring-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Solved
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 relative">
          <Button
            onClick={handleMarkSolved}
            disabled={isSolving}
            className="w-full md:w-auto bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2 font-bold rounded-xl"
          >
            {isSolved ? <CheckCircle className="h-4 w-4" /> : null}
            {isSolving ? "Saving..." : isSolved ? "Solved Again" : "Mark as Solved"}
          </Button>
        </div>
      </div>

      {/* Grid: Details on Left, Interactive Visualizer on Right */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Side: Question, Complexity & Code tabs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Problem description */}
          <div className="surface-card p-6 space-y-4">
            <h2 className="font-display font-bold text-base text-content flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-600" />
              Problem Description
            </h2>
            <div className="text-sm leading-relaxed text-content-2 whitespace-pre-wrap font-medium">
              {problem.description}
            </div>
          </div>

          {/* Complexity analysis card */}
          <div className="surface-card p-6 space-y-4">
            <h2 className="font-display font-bold text-base text-content flex items-center gap-2">
              <LineChart className="h-4 w-4 text-violet-600" />
              Algorithmic Complexity
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-2 p-4 border border-border-app/65">
                <p className="text-xs font-bold text-content-muted uppercase tracking-wider">Naive Approach</p>
                <div className="mt-2.5 space-y-1">
                  <p className="text-sm font-semibold text-content">Time: <span className="font-mono text-xs font-bold text-rose-600">{problem.naiveSolution.timeComplexity}</span></p>
                  <p className="text-sm font-semibold text-content">Space: <span className="font-mono text-xs font-bold text-content-2">{problem.naiveSolution.spaceComplexity}</span></p>
                </div>
              </div>
              <div className="rounded-2xl bg-violet-500/5 p-4 border border-violet-500/10">
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Optimized Approach</p>
                <div className="mt-2.5 space-y-1">
                  <p className="text-sm font-semibold text-content">Time: <span className="font-mono text-xs font-bold text-emerald-600">{problem.optimizedSolution.timeComplexity}</span></p>
                  <p className="text-sm font-semibold text-content">Space: <span className="font-mono text-xs font-bold text-content-2">{problem.optimizedSolution.spaceComplexity}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes area */}
          <div className="surface-card p-6 space-y-4">
            <label htmlFor="notes" className="font-display font-bold text-base text-content block">
              Personal Study Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write down any key takeaways, tricky cases, or revision tips..."
              rows={4}
              className="w-full resize-none rounded-2xl border border-border-app bg-surface px-4 py-3 text-sm text-content placeholder-content-muted shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
            />
          </div>
        </div>

        {/* Right Side: Code Viewer & Algorithm Visualizer */}
        <div className="lg:col-span-5 space-y-6">
          {/* Custom interactive visualizer if applicable */}
          {[1, 79, 97, 146].includes(problemId) && (
            <AlgorithmVisualizer problemId={problemId} />
          )}

          {/* Solution Code section */}
          <div className="surface-card overflow-hidden">
            {/* Header switcher tabs */}
            <div className="flex border-b border-border-app bg-surface-2 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("visualizer")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === "visualizer"
                    ? "bg-surface text-violet-600 shadow-sm"
                    : "text-content-muted hover:text-content"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Explain
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("naive")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === "naive"
                    ? "bg-surface text-content shadow-sm"
                    : "text-content-muted hover:text-content"
                }`}
              >
                <Code className="h-3.5 w-3.5" /> Naive
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("optimized")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === "optimized"
                    ? "bg-surface text-emerald-600 shadow-sm"
                    : "text-content-muted hover:text-content"
                }`}
              >
                <Code className="h-3.5 w-3.5" /> Optimal
              </button>
            </div>

            {activeTab === "visualizer" ? (
              <div className="p-6 space-y-4">
                <h4 className="font-display font-bold text-sm text-content">Solution Strategy</h4>
                <p className="text-xs text-content-2 leading-relaxed font-medium">
                  {problem.optimizedSolution.explanation}
                </p>
                <div className="border-t border-border-app/60 pt-4 space-y-2">
                  <p className="text-xs text-content-2 leading-relaxed font-medium">
                    <span className="font-bold text-content">Naive Approach:</span> {problem.naiveSolution.explanation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Language bar */}
                <div className="flex border-b border-border-app px-4 py-2 justify-between items-center bg-surface-3/30">
                  <div className="flex gap-2">
                    {["python", "javascript", "typescript", "cpp", "java"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded transition ${
                          language === lang
                            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            : "text-content-muted hover:text-content"
                        }`}
                      >
                        {lang === "cpp" ? "C++" : lang}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg border border-border-app hover:bg-surface-2 transition text-content-muted hover:text-content"
                    title="Copy Code"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[350px] leading-relaxed select-all selection:bg-violet-600/40 selection:text-white">
                  <code>{codeString}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
