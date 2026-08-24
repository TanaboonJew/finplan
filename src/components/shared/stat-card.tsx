import { cn } from "@/lib/utils";

export type StatCardTone = "default" | "positive" | "negative";

export interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  tone?: StatCardTone;
  icon?: React.ReactNode;
  className?: string;
}

const toneClasses: Record<StatCardTone, string> = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-red-600 dark:text-red-400",
};

export function StatCard({
  label,
  value,
  sublabel,
  tone = "default",
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span aria-hidden className="text-muted-foreground">
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          toneClasses[tone]
        )}
      >
        {value}
      </p>
      {sublabel ? (
        <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      ) : null}
    </div>
  );
}
