"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { MonthlyAggregate } from "@/lib/finance/budget";
import { formatCompactCurrency } from "@/lib/finance/format";
import {
  formatMonthShort,
  localeTagOf,
} from "./budget-locale";

const MONTHS_PER_YEAR = 12;

interface ChartPoint {
  month: number;
  label: string;
  planned: number;
  actual: number;
}

interface BudgetTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string | number;
    value?: number | string | Array<number | string>;
    color?: string;
    payload?: ChartPoint;
  }>;
  tag: string;
  currency: string;
}

function BudgetTooltip({
  active,
  payload,
  tag,
  currency,
}: BudgetTooltipProps) {
  if (active !== true || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {point ? <p className="font-medium">{point.label}</p> : null}
      <div className="mt-1 space-y-0.5">
        {payload.map((item) => (
          <div
            key={String(item.dataKey)}
            className="flex items-center justify-between gap-4"
          >
            <span style={{ color: item.color }}>{item.name}</span>
            <span className="tabular-nums">
              {typeof item.value === "number"
                ? formatCompactCurrency(item.value, { locale: tag, currency })
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlanVsActualChart({
  aggregate,
}: {
  aggregate: MonthlyAggregate;
}) {
  const t = useTranslations("budget.chart");
  const locale = useLocale();
  const tag = localeTagOf(locale);
  const currency = tag === "th-TH" ? "THB" : "USD";

  const data = useMemo<ChartPoint[]>(
    () =>
      Array.from({ length: MONTHS_PER_YEAR }, (_, month) => ({
        month,
        label: formatMonthShort(month, tag),
        planned: Math.round(aggregate.planned[month] * 100) / 100,
        actual: Math.round(aggregate.actual[month] * 100) / 100,
      })),
    [aggregate.planned, aggregate.actual, tag]
  );

  const hasData = data.some(
    (point) => point.planned > 0 || point.actual > 0
  );

  return (
    <ChartCard title={t("title")} description={t("description")} height={280}>
      {hasData ? (
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            opacity={0.12}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickMargin={6}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value: number) =>
              formatCompactCurrency(value, { locale: tag, currency })
            }
            width={64}
          />
          <Tooltip
            cursor={{ opacity: 0.08 }}
            content={<BudgetTooltip tag={tag} currency={currency} />}
          />
          <Legend />
          <Bar
            dataKey="planned"
            name={t("planned")}
            fill="#94a3b8"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="actual"
            name={t("actual")}
            fill="#10b981"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      ) : (
        <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      )}
    </ChartCard>
  );
}
