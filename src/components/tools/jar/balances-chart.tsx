"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { JarActivity } from "@/lib/finance/jars";
import type { Jar } from "@/lib/storage/jar-store";
import { useMoney } from "./controls";

const SLICE_COLORS = [
  "#059669",
  "#0d9488",
  "#65a30d",
  "#ca8a04",
  "#ea580c",
  "#be185d",
  "#7c3aed",
  "#0369a1",
  "#57534e",
];

interface BalancesChartProps {
  jars: Jar[];
  activity: Map<string, JarActivity>;
}

export function BalancesChart({ jars, activity }: BalancesChartProps) {
  const t = useTranslations("jar.chart");
  const money = useMoney();

  const data = useMemo(
    () =>
      jars
        .map((jar) => ({
          name: jar.name,
          value: Math.max(0, activity.get(jar.id)?.balance ?? 0),
        }))
        .filter((slice) => slice.value > 1e-9),
    [jars, activity]
  );

  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <ChartCard title={t("title")} description={t("description")} height={240}>
      <div className="flex h-full flex-col items-center gap-4 sm:flex-row">
        <div className="h-40 w-40 shrink-0 sm:h-full sm:w-1/2">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="92%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((slice, index) => (
                  <Cell
                    key={slice.name}
                    fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => money.currency(Number(value))}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          )}
        </div>

        <ul className="grid w-full min-w-0 gap-1.5 sm:w-1/2">
          {data.map((slice, index) => (
            <li key={slice.name} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
              />
              <span className="min-w-0 flex-1 truncate">{slice.name}</span>
              <span className="shrink-0 tabular-nums">
                {money.currency(slice.value)}
              </span>
              <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {total > 0 ? money.percent(slice.value / total) : "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
