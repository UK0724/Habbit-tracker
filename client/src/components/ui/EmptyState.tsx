import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles, LucideIcon } from "lucide-react";
import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionHref?: string;
  actionLabel?: string;
  action?: ReactNode;
};

export const EmptyState = ({
  title,
  description,
  icon: Icon,
  actionHref,
  actionLabel,
  action
}: EmptyStateProps) => (
  <div className="surface-card relative overflow-hidden px-6 py-12 text-center sm:px-10 border border-border-app shadow-sm">
    <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />

    <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent/20 to-accent/5 ring-1 ring-accent/30 text-accent shadow-inner">
      {Icon ? (
        <Icon className="h-8 w-8" />
      ) : (
        <Sparkles className="h-8 w-8 animate-pulse" />
      )}
    </div>

    <h2 className="font-display text-2xl font-bold text-content tracking-tight">
      {title}
    </h2>
    <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-content-muted sm:text-base">
      {description}
    </p>

    <div className="mt-6 flex justify-center">
      {action ? action : null}
      {!action && actionHref && actionLabel ? (
        <Button asChild className="font-bold shadow-md shadow-accent/20">
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  </div>
);
