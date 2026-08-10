import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";

interface Step {
  explanation: string;
  state: any;
}

export const AlgorithmVisualizer = ({ problemId }: { problemId: number }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate steps based on problem ID
  const steps = useMemoSteps(problemId);

  // Auto playback handler
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    }

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [isPlaying, steps.length]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const activeStep = steps[currentStep] || { explanation: "No step data available.", state: {} };

  // If no simulation exists for this problem
  if (steps.length === 0) {
    return (
      <div className="surface-card p-6 border border-border-app bg-surface-2 text-center text-content-muted">
        <p className="text-sm font-medium">Interactive visual dry-runs are loaded for archetype problems (e.g. Q1, Q79, Q97, Q146).</p>
        <p className="text-xs mt-1.5">You can read details and check off other problems in the catalog as solved.</p>
      </div>
    );
  }

  return (
    <div className="surface-card p-5 border border-violet-500/20 bg-violet-500/[0.02] rounded-2xl space-y-5">
      <div className="flex items-center justify-between border-b border-border-app pb-3">
        <h3 className="font-display font-bold text-sm text-content flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-violet-600 animate-ping" />
          Interactive Code Trace Visualizer
        </h3>
        <span className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold px-2 py-0.5 rounded">
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>

      {/* Render custom animation depending on archetype */}
      <div className="min-h-[160px] flex items-center justify-center bg-surface border border-border-app rounded-xl p-6 relative overflow-hidden">
        {problemId === 1 && renderTwoSum(activeStep.state)}
        {problemId === 79 && renderValidParentheses(activeStep.state)}
        {problemId === 97 && renderReverseLinkedList(activeStep.state)}
        {problemId === 146 && renderBinarySearch(activeStep.state)}
      </div>

      {/* Explanation banner */}
      <div className="rounded-xl bg-violet-500/5 border border-violet-500/10 p-3.5">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Step Explanation</p>
        <p className="text-xs text-content mt-1 leading-relaxed font-medium">{activeStep.explanation}</p>
      </div>

      {/* Playback Controls bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Slider */}
        <input
          type="range"
          min="0"
          max={steps.length - 1}
          value={currentStep}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentStep(Number(e.target.value));
          }}
          className="flex-1 accent-violet-600 h-1.5 rounded bg-surface-3 outline-none"
        />

        {/* Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleReset}
            title="Reset"
            className="p-2 rounded-xl bg-surface hover:bg-surface-3 text-content-2 border border-border-app hover:text-content transition"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            title="Step Back"
            className="p-2 rounded-xl bg-surface hover:bg-surface-3 text-content-2 border border-border-app hover:text-content transition disabled:opacity-50"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause" : "Play Animation"}
            className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
            title="Step Forward"
            className="p-2 rounded-xl bg-surface hover:bg-surface-3 text-content-2 border border-border-app hover:text-content transition disabled:opacity-50"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Custom Render Functions for Archetypes ---

function renderTwoSum(state: any) {
  const { numbers, index, map, target, complement, found } = state;
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md">
      {/* Array Elements */}
      <div className="flex gap-2">
        {numbers.map((num: number, idx: number) => {
          const isActive = idx === index && !found;
          const isResult = found && (num === 7 || num === 2);
          return (
            <div key={idx} className="relative flex flex-col items-center w-14">
              <div className={`h-11 w-11 rounded-xl font-mono text-sm font-bold flex items-center justify-center border transition ${
                isResult
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 scale-105"
                  : isActive
                    ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400 scale-105"
                    : "border-border-app bg-surface-2 text-content-2"
              }`}>
                {num}
              </div>
              <div className="absolute top-12 text-[9px] font-bold text-content-muted leading-normal">
                Idx {idx}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hash Map and checking logic */}
      <div className="w-full grid grid-cols-2 gap-4 mt-2">
        <div className="bg-surface-2 border border-border-app/40 rounded-xl p-3 flex flex-col justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-content-muted mb-2">Hash Map (Seen Values)</p>
          <div className="space-y-1 text-xs font-mono text-content-2">
            {Object.keys(map).length > 0 ? (
              Object.entries(map).map(([key, val]) => (
                <div key={key} className="flex justify-between border-b border-border-app/20 pb-0.5">
                  <span>{key}</span>
                  <span className="text-violet-500">idx {val as any}</span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-content-subtle italic">Empty Map</span>
            )}
          </div>
        </div>

        <div className="bg-surface-2 border border-border-app/40 rounded-xl p-3 flex flex-col justify-center gap-1.5 text-xs font-semibold text-content-2">
          {complement !== null ? (
            <>
              <div>Target: <span className="font-bold">{target}</span></div>
              <div>Current: <span className="text-violet-600 font-bold">{numbers[index] ?? 7}</span></div>
              <div>Complement: <span className="text-amber-500 font-bold">{complement}</span></div>
              <div className="mt-1 text-[11px]">
                {found ? (
                  <span className="text-emerald-600 font-extrabold">✓ Found in Map!</span>
                ) : (
                  <span className="text-content-muted">✗ Not in Map</span>
                )}
              </div>
            </>
          ) : (
            <span className="text-content-subtle italic">Press next to scan...</span>
          )}
        </div>
      </div>
    </div>
  );
}

function renderValidParentheses(state: any) {
  const { s, index, stack } = state;
  return (
    <div className="flex items-stretch justify-around gap-8 w-full max-w-sm">
      {/* Input stream */}
      <div className="flex flex-col justify-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted mb-2">Input Stream</p>
        <div className="flex gap-1.5 font-mono text-base font-bold">
          {s.split("").map((char: string, idx: number) => {
            const isActive = idx === index;
            const isProcessed = idx < index;
            return (
              <span key={idx} className={isActive ? "text-violet-600 scale-125 border-b-2 border-violet-500 px-0.5" : isProcessed ? "text-content-muted line-through" : "text-content"}>
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Visual Stack frame */}
      <div className="flex flex-col items-center w-28">
        <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted mb-2">Stack Frame</p>
        <div className="w-16 h-28 border-2 border-dashed border-border-app rounded-xl bg-surface-2 flex flex-col-reverse justify-start p-1.5 gap-1.5 overflow-hidden">
          {stack.length > 0 ? (
            stack.map((char: string, idx: number) => (
              <div key={idx} className="h-6 rounded bg-violet-600 text-white font-mono text-sm font-bold flex items-center justify-center shadow animate-fade-in-up">
                {char}
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-[10px] text-content-muted font-bold">
              Empty
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderReverseLinkedList(state: any) {
  const { nodes, prev, curr, next } = state;
  return (
    <div className="flex flex-wrap items-center justify-center gap-y-6 w-full">
      {nodes.map((node: { id: number; val: number; nextId: number | null }, idx: number) => {
        const isPrev = node.id === prev;
        const isCurr = node.id === curr;
        const isNext = node.id === next;

        // Render arrow depending on pointer direction
        // In reverse list, if node ID is <= prev, it has been reversed pointing left.
        // If node ID is curr or next, it still points right.
        const isReversed = prev !== null && node.id <= prev;

        return (
          <div key={node.id} className="flex items-center">
            {/* Node block */}
            <div className="relative flex flex-col items-center w-12 mx-2">
              <div className={`h-11 w-11 rounded-full font-mono text-sm font-bold flex items-center justify-center border transition ${
                isCurr
                  ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400 scale-105 ring-4 ring-violet-500/20"
                  : isPrev
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                  : "border-border-app bg-surface-2 text-content-2"
              }`}>
                {node.val}
              </div>
              <div className="absolute top-12 text-[9px] font-bold leading-normal text-center select-none w-20">
                {isCurr ? <span className="text-violet-600">curr</span> : isPrev ? <span className="text-emerald-600">prev</span> : isNext ? <span className="text-content-muted">next</span> : ""}
              </div>
            </div>

            {/* Pointer arrow icon */}
            {idx < nodes.length - 1 && (
              <div className="flex items-center shrink-0 w-8 h-6 text-content-muted">
                {isReversed ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 rotate-180 text-emerald-500 stroke-2" fill="none" stroke="currentColor">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-2" fill="none" stroke="currentColor">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderBinarySearch(state: any) {
  const { nums, low, high, mid, target } = state;
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Numbers block list */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {nums.map((num: number, idx: number) => {
          const isActiveRange = idx >= low && idx <= high;
          const isMid = idx === mid;
          return (
            <div key={idx} className="relative flex flex-col items-center w-12">
              <div className={`h-10 w-10 rounded-lg font-mono text-sm font-bold flex items-center justify-center border transition ${
                isMid
                  ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400 scale-105"
                  : isActiveRange
                  ? "border-border-app bg-surface-2 text-content"
                  : "border-border-app/30 bg-surface-3/50 text-content-muted opacity-30"
              }`}>
                {num}
              </div>
              <div className="absolute top-11 text-[9px] font-bold text-violet-600 dark:text-violet-400 leading-normal select-none">
                {isMid ? "mid" : idx === low ? "low" : idx === high ? "high" : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center font-semibold text-xs text-content-2">
        Target: <span className="text-violet-600 font-bold">{target}</span> | Mid Element: <span className="text-content font-bold">{nums[mid]}</span>
      </div>
    </div>
  );
}

// --- Steps Seeder Hook ---

function useMemoSteps(problemId: number): Step[] {
  if (problemId === 1) {
    // Two Sum (unsorted array using HashMap)
    const numbers = [2, 11, 7, 15];
    const target = 9;
    return [
      {
        explanation: "Initialize an empty Hash Map to store numbers and their indices. Start scanning from index 0.",
        state: { numbers, index: 0, map: {}, target, complement: null, found: false }
      },
      {
        explanation: "Scan index 0 (val: 2). Complement is 9 - 2 = 7. 7 is not in the map. Store 2 at index 0.",
        state: { numbers, index: 1, map: { 2: 0 }, target, complement: 7, found: false }
      },
      {
        explanation: "Scan index 1 (val: 11). Complement is 9 - 11 = -2. -2 is not in the map. Store 11 at index 1.",
        state: { numbers, index: 2, map: { 2: 0, 11: 1 }, target, complement: -2, found: false }
      },
      {
        explanation: "Scan index 2 (val: 7). Complement is 9 - 7 = 2. 2 is found in the map at index 0! Return index pair [0, 2].",
        state: { numbers, index: 2, map: { 2: 0, 11: 1 }, target, complement: 2, found: true }
      }
    ];
  }

  if (problemId === 79) {
    // Valid Parentheses
    const s = "()[]{}";
    return [
      {
        explanation: "Start with an empty stack. We will scan the characters left-to-right.",
        state: { s, index: 0, stack: [] }
      },
      {
        explanation: "Scan '(' (open bracket). Push its closing pair ')' onto the stack.",
        state: { s, index: 1, stack: [")"] }
      },
      {
        explanation: "Scan ')' (closing bracket). Pop the stack top. It matches ')'. Continuing...",
        state: { s, index: 2, stack: [] }
      },
      {
        explanation: "Scan '[' (open bracket). Push its closing pair ']' onto the stack.",
        state: { s, index: 3, stack: ["]"] }
      },
      {
        explanation: "Scan ']' (closing bracket). Pop the stack top. It matches ']'. Continuing...",
        state: { s, index: 4, stack: [] }
      },
      {
        explanation: "Scan '{' (open bracket). Push its closing pair '}' onto the stack.",
        state: { s, index: 5, stack: ["}"] }
      },
      {
        explanation: "Scan '}' (closing bracket). Pop the stack top. It matches '}'. Continuing...",
        state: { s, index: 6, stack: [] }
      },
      {
        explanation: "String fully scanned. The stack is empty, meaning all brackets were balanced. Return true.",
        state: { s, index: 6, stack: [] }
      }
    ];
  }

  if (problemId === 97) {
    // Reverse a Linked List
    const nodes = [
      { id: 0, val: 1, nextId: 1 },
      { id: 1, val: 2, nextId: 2 },
      { id: 2, val: 3, nextId: 3 },
      { id: 3, val: 4, nextId: null }
    ];
    return [
      {
        explanation: "Initialize pointers: prev = null, curr = Node 1, next = Node 2. List points forwards.",
        state: { nodes, prev: null, curr: 0, next: 1 }
      },
      {
        explanation: "Reverse Node 1 next pointer to point back to prev (null). Shift prev to Node 1, curr to Node 2, next to Node 3.",
        state: { nodes, prev: 0, curr: 1, next: 2 }
      },
      {
        explanation: "Reverse Node 2 next pointer to point back to prev (Node 1). Shift prev to Node 2, curr to Node 3, next to Node 4.",
        state: { nodes, prev: 1, curr: 2, next: 3 }
      },
      {
        explanation: "Reverse Node 3 next pointer to point back to prev (Node 2). Shift prev to Node 3, curr to Node 4, next = null.",
        state: { nodes, prev: 2, curr: 3, next: null }
      },
      {
        explanation: "Reverse Node 4 next pointer to point back to prev (Node 3). Shift prev to Node 4, curr = null.",
        state: { nodes, prev: 3, curr: null, next: null }
      },
      {
        explanation: "curr is null, traversal complete. The reversed list head is prev (Node 4). Return prev.",
        state: { nodes, prev: 3, curr: null, next: null }
      }
    ];
  }

  if (problemId === 146) {
    // Binary Search
    const nums = [-1, 0, 3, 5, 9, 12];
    const target = 9;
    return [
      {
        explanation: "Initialize boundaries: low = 0 (val: -1), high = 5 (val: 12). Calculate mid index: (0 + 5) / 2 = 2 (val: 3).",
        state: { nums, low: 0, high: 5, mid: 2, target }
      },
      {
        explanation: "Since mid element 3 < target (9), the target must be in the right subarray. Shift search space: low = mid + 1 (3).",
        state: { nums, low: 3, high: 5, mid: 4, target }
      },
      {
        explanation: "Calculate mid index: (3 + 5) / 2 = 4 (val: 9). Compare mid element 9 to target. Match! Return index 4.",
        state: { nums, low: 3, high: 5, mid: 4, target }
      }
    ];
  }

  return [];
}
