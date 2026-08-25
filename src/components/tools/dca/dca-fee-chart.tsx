"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { DcaFundResult } from "@/lib/finance/dca";
import { formatMoney, localeTagOf } from "@/components/tools/dca/dca-format";

const FEE_COLORS = ["#ef4444", "#f97316", "#a855f7", "#06b6d4"];

interface FeeTooltipProps {
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

function FeeTooltip({ active, payload, localeTag, currency, labels }: FeeTooltipProps) {
  if (active !== true || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">Month {payload[0]?.payload?.month ?? 0}</p>
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

function buildFeeData(results: readonly DcaFundResult[]) {
  if (results.length === 0) return [];
  const maxMonths = Math.max(...results.map((r) => r.schedule.length - 1));
  const points: Array<Record<string, number>> = [];

  for (let m = 0; m <= maxMonths; m += 1) {
    const point: Record<string, number> = { month: m };
    for (let i = 0; i < results.length; i += 1) {
      const schedule = results[i].schedule;
      point[`fee${i}`] = m < schedule.length ? schedule[m].cumulativeFees : 0;
    }
    points.push(point);
  }
  return points;
}

export interface DcaFeeChartProps {
  results: readonly DcaFundResult[];
  currency: string;
}

export function DcaFeeChart({ results, currency }: DcaFeeChartProps) {
  const t = useTranslations("dca.feeChart");
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

  const data = buildFeeData(results);
  const labels = results.map((r) => r.fund.name);

  return (
    <ChartCard title={t("title")} description={t("description")} height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
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
            <FeeTooltip
              localeTag={localeTag}
              currency={currency}
              labels={labels}
            />
          }
        />
        <Legend
          formatter={(value: string) => {
            const idx = parseInt(value.replace("fee", ""), 10);
            return results[idx]?.fund.name ?? value;
          }}
        />
        {results.map((_, i) => (
          <Area
            key={`fee${i}`}
            type="monotone"
            dataKey={`fee${i}`}
            stroke={FEE_COLORS[i % FEE_COLORS.length]}
            fill={FEE_COLORS[i % FEE_COLORS.length]}
            fillOpacity={0.3}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ChartCard>
  );
}
