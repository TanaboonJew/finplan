"use client";

import { useTranslations } from "next-intl";
import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { Allocation } from "@/lib/finance/portfolio";

const CLASS_COLORS: Record<string, string> = {
  Equity: "#10b981",
  Bonds: "#6366f1",
  Cash: "#94a3b8",
  Gold: "#f59e0b",
  Crypto: "#ec4899",
};

const FALLBACK_COLORS = ["#10b981", "#6366f1", "#94a3b8", "#f59e0b", "#ec4899", "#14b8a6"];

export function AllocationDonut({
  allocations,
  formatMoney,
}: {
  allocations: readonly Allocation[];
  formatMoney: (value: number) => string;
}) {
  const t = useTranslations("portfolio-analyzer.donut");

  if (allocations.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {t("emptyTitle")}
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          {t("emptyMessage")}
        </p>
      </div>
    );
  }

  return (
    <ChartCard title={t("title")} height={300}>
      <PieChart>
        <Pie
          data={allocations.map((a) => ({
            name: a.assetClass,
            value: Number(a.value.toFixed(2)),
          }))}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          stroke="none"
        >
          {allocations.map((alloc, i) => (
            <Cell
              key={alloc.assetClass}
              fill={
                CLASS_COLORS[alloc.assetClass] ??
                FALLBACK_COLORS[i % FALLBACK_COLORS.length]
              }
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [
            `${formatMoney(Number(value))} (${formatPercent(
              Number(value) /
                allocations.reduce((sum, a) => sum + a.value, 0)
            )})`,
            String(name),
          ]}
        />
        <Legend />
      </PieChart>
    </ChartCard>
  );
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
