import { ReactNode } from "react";
import { Link } from "react-router-dom";

import { getHabitTheme } from "../../../shared/lib/habitTheme";
import { cn } from "../../../shared/lib/utils";

type HabitCardProps = {
  habitId: string;
  color: string;
  title: string;
  label: string;
  badge?: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export const HabitCard = ({
  habitId,
  color,
  title,
  label,
  badge,
  summary,
  children,
  footer
}: HabitCardProps) => {
  const theme = getHabitTheme(color);

  return (
    <article className="surface-card relative overflow-hidden p-5 sm:p-6">
      <div className={cn("absolute inset-x-0 top-0 h-1.5", theme.accent)} />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          theme.tint
        )}
      />

      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1",
                  theme.soft
                )}
              >
                {label}
              </span>
              {badge}
            </div>
            <Link
              to={`/habits/${habitId}`}
              className="mt-3 inline-block font-display text-2xl font-bold tracking-tight text-slate-950 transition hover:text-indigo-700"
            >
              {title}
            </Link>
          </div>

          {summary ? <div className="sm:max-w-xs">{summary}</div> : null}
        </div>

        <div className="mt-6">{children}</div>

        {footer ? (
          <div className="mt-6 border-t border-slate-100 pt-4">{footer}</div>
        ) : null}
      </div>
    </article>
  );
};
