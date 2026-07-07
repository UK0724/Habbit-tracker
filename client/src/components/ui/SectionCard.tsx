import { ReactNode } from "react";

import { cn } from "../../shared/lib/utils";

type SectionCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const SectionCard = ({
  title,
  description,
  action,
  children,
  className
}: SectionCardProps) => (
  <section className={cn("surface-card p-5 sm:p-6", className)}>
    {title || description || action ? (
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {title ? (
            <h2 className="text-lg font-bold text-content">{title}</h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-6 text-content-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    ) : null}

    {children}
  </section>
);
