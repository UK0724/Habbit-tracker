import { AnimatePresence,motion } from "framer-motion";
import { useXPToastStore } from "../../stores/xpToastStore";

export const XPToast = () => {
  const toasts = useXPToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.8 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -30,
              scale: [0.8, 1.05, 1, 0.95]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.9, times: [0, 0.15, 0.75, 1], ease: "easeOut" }}
            style={{
              left: toast.x !== undefined ? toast.x : "50%",
              top: toast.y !== undefined ? toast.y : "12%",
              transform: toast.x === undefined ? "translateX(-50%)" : undefined
            }}
            className={`fixed flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm sm:text-base font-extrabold shadow-2xl backdrop-blur-md ${
              toast.amount >= 0
                ? "border-emerald-400/50 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-[0_8px_30px_rgba(16,185,129,0.35)]"
                : "border-rose-400/50 bg-gradient-to-r from-rose-600 via-rose-500 to-red-400 text-white shadow-[0_8px_30px_rgba(244,63,94,0.35)]"
            }`}
          >
            {toast.amount >= 0 ? (
              <>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-xs font-black">
                  ✓
                </span>
                <span>{toast.title || "Completed!"}</span>
                <span className="rounded-lg bg-black/20 px-2 py-0.5 text-xs font-black text-amber-300">
                  +{toast.amount} {toast.label}
                </span>
                <span>✨</span>
              </>
            ) : (
              <>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-xs font-black">
                  ↩
                </span>
                <span>{toast.title || "Undone"}</span>
                <span className="rounded-lg bg-black/20 px-2 py-0.5 text-xs font-black text-rose-100">
                  {toast.amount} {toast.label}
                </span>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
