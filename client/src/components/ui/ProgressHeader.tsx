import { Flame, Gem, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function ProgressHeader({ xp, gems, streak, freezes }: { xp?: number; gems?: number; streak?: number; freezes?: number }) {
  const stats = [
    { label: "XP", value: xp, Icon: Zap, color: "text-amber-700 dark:text-amber-400", description: "total XP" },
    { label: "Gems", value: gems, Icon: Gem, color: "text-sky-700 dark:text-sky-400", description: "gems available" },
    { label: "Freezes", value: freezes, Icon: Shield, color: "text-cyan-700 dark:text-cyan-300", description: "streak freezes ready" },
    { label: "Streak", value: streak, Icon: Flame, color: "text-orange-700 dark:text-orange-400", description: "day streak" }
  ];
  return (
    <div aria-label="Your progress" className="grid min-w-0 flex-1 grid-cols-4 gap-0.5 sm:gap-4">
      {stats.map(({ label, value, Icon, color, description }) => (
        <Link key={label} to="/profile" title={value == null ? `${label} loading` : `${value.toLocaleString()} ${description}`}
          aria-label={value == null ? `${label} loading` : `${value.toLocaleString()} ${description}`}
          className="flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-lg px-0.5 transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:gap-2">
          <Icon aria-hidden size={21} strokeWidth={2.5} className={`shrink-0 ${color}`} fill="currentColor" fillOpacity={0.18} />
          <span className="min-w-0 leading-tight">
            <span className={`block text-base font-extrabold tabular-nums ${color}`}>{value == null ? "—" : compact.format(value)}</span>
            <span className="block text-[10px] font-semibold text-content-muted">{label}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
