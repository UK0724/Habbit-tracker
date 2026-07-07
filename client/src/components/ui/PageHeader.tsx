import { ReactNode } from "react";

import { cn } from "../../shared/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  className
}: PageHeaderProps) => (
  <section
    className={cn(
      "surface-card relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8",
      className
    )}
  >
    <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-accent/8 via-accent/10 to-transparent" />

    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-xl text-sm leading-6 text-content-2 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  </section>
);
