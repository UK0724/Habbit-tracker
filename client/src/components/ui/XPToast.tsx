import { AnimatePresence, motion } from "framer-motion";
import { useXPToastStore } from "../../stores/xpToastStore";
import { useReducedMotion } from "../../shared/hooks/useReducedMotion";
import { cn } from "../../shared/lib/utils";

const formatAmount = (amount: number, label: string) =>
  amount < 0
    ? `−${Math.abs(amount)} ${label}`
    : `+${amount} ${label}`;

export const XPToast = () => {
  const toasts = useXPToastStore((s) => s.toasts);
  const reducedMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[12%] z-[60] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout={!reducedMotion}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.25, ease: "easeOut" }}
            className={cn(
              "flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-extrabold shadow-xl backdrop-blur-md",
              toast.tone === "gain" &&
                "border-emerald-400/50 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white",
              toast.tone === "gems" &&
                "border-cyan-400/50 bg-gradient-to-r from-cyan-600 to-sky-600 text-white",
              toast.tone === "loss" &&
                "border-border-app bg-surface-2/95 text-content-muted"
            )}
          >
            <span>{toast.title}</span>
            {/* Message-only toasts (amount 0) have no reward to show. */}
            {toast.amount !== 0 && (
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-xs font-black",
                  toast.tone === "loss"
                    ? "bg-surface-3 text-content-muted"
                    : "bg-black/25 text-white"
                )}
              >
                {formatAmount(toast.amount, toast.label)}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
