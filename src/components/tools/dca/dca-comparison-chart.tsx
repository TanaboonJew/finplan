"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { DcaFundResult } from "@/lib/finance/dca";
import { formatMoney, localeTagOf } from "@/components/tools/dca/dca-format";

const FUND_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ec4899"];
const GROSS_COLOR = "#94a3b8";

interface ComparisonTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number;
    color?: string;
    payload?: { month: number; [key: string]: number };
  }>;
  localeTag: string;
  currency: string;
  labels: string[];
}

function ComparisonTooltip({
  active,
  payload,
  localeTag,
  currency,
  labels,
}: ComparisonTooltipProps) {
  if (active !== true || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">Month {point.month}</p>
      <div className="mt-1 space-y-0.5">
        {payload.map((entry, i) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }}>
              {labels[i] ?? entry.dataKey}
            </span>
            <span className="tabular-nums">
              {formatMoney(entry.value ?? 0, localeTag, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildComparisonData(results: readonly DcaFundResult[]) {
  if (results.length === 0) return [];
  const maxMonths = Math.max(...results.map((r) => r.schedule.length - 1));
  const points: Array<Record<string, number>> = [];

  for (let m = 0; m <= maxMonths; m += 1) {
    const point: Record<string, number> = { month: m };
    for (let i = 0; i < results.length; i += 1) {
      const schedule = results[i].schedule;
      point[`fund${i}`] = m < schedule.length ? schedule[m].balance : 0;
    }
    if (results.length > 0 && results[0].schedule[m]) {
      point.gross = results[0].schedule[m].grossBalance;
    }
    points.push(point);
  }
  return points;
}

export interface DcaComparisonChartProps {
  results: readonly DcaFundResult[];
  currency: string;
}

export function DcaComparisonChart({ results, currency }: DcaComparisonChartProps) {
  const t = useTranslations("dca.comparisonChart");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  if (results.length === 0) {
    return (
      <ChartCard title={t("title")} description={t("description")}>
        <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      </ChartCard>
    );
  }

  const data = buildComparisonData(results);
  const labels = results.map((r) => r.fund.name);
  labels.push(t("grossLabel"));

  return (
    <ChartCard title={t("title")} description={t("description")} height={340}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          opacity={0.12}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          tickMargin={6}
          interval="preserveStartEnd"
          minTickGap={48}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(value: number) =>
            formatMoney(value, localeTag, currency).split(".")[0]
          }
          width={64}
        />
        <Tooltip
          content={
            <ComparisonTooltip
              localeTag={localeTag}
              currency={currency}
              labels={labels}
            />
          }
        />
        <Legend
          formatter={(value: string) => {
            if (value === "gross") return t("grossLabel");
            const idx = parseInt(value.replace("fund", ""), 10);
            return results[idx]?.fund.name ?? value;
          }}
        />
        {results.map((_, i) => (
          <Line
            key={`fund${i}`}
            type="monotone"
            dataKey={`fund${i}`}
            stroke={FUND_COLORS[i % FUND_COLORS.length]}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
        <Line
          type="monotone"
          dataKey="gross"
          stroke={GROSS_COLOR}
          strokeWidth={1.5}
          strokeDasharray="6 3"
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartCard>
  );
}
