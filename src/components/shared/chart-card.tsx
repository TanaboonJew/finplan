"use client";

import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export interface ChartCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  height?: number;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  actions,
  height = 280,
  children,
  className,
}: ChartCardProps) {
  return (
    <section
      data-slot="chart-card"
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
