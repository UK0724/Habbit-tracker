import { ReactNode } from "react";

import { Link } from "react-router-dom";

import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  action?: ReactNode;
};

export const EmptyState = ({
  title,
  description,
  actionHref,
  actionLabel,
  action
}: EmptyStateProps) => (
  <div className="surface-card px-6 py-10 text-center sm:px-10">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-xl font-bold text-accent">
      +
    </div>
    <h2 className="font-display text-2xl font-bold text-content">{title}</h2>
    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-content-muted sm:text-base">
      {description}
    </p>
    <div className="mt-6 flex justify-center">
      {action ? action : null}
      {!action && actionHref && actionLabel ? (
        <Button asChild>
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  </div>
);
