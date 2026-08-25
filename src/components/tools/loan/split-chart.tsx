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
import type { AmortizationRow } from "@/lib/finance/amortization";
import { formatMoney, localeTagOf } from "@/components/tools/loan/loan-format";

interface SplitPoint {
  month: number;
  principal: number;
  interest: number;
}

function buildSplitData(schedule: readonly AmortizationRow[]): SplitPoint[] {
  return schedule.map((row) => ({
    month: row.month,
    principal: Math.round(row.principal * 100) / 100,
    interest: Math.round(row.interest * 100) / 100,
  }));
}

interface SplitTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number;
    color?: string;
    payload?: SplitPoint;
  }>;
  currency: string;
  localeTag: string;
  principalLabel: string;
  interestLabel: string;
}

function SplitTooltip({
  active,
  payload,
  currency,
  localeTag,
  principalLabel,
  interestLabel,
}: SplitTooltipProps) {
  if (active !== true || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">Month {point.month}</p>
      <div className="mt-1 space-y-0.5">
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: "#10b981" }}>{principalLabel}</span>
          <span className="tabular-nums">
            {formatMoney(point.principal, localeTag, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: "#f59e0b" }}>{interestLabel}</span>
          <span className="tabular-nums">
            {formatMoney(point.interest, localeTag, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

export interface SplitChartProps {
  schedule: readonly AmortizationRow[];
  currency: string;
}

export function SplitChart({ schedule, currency }: SplitChartProps) {
  const t = useTranslations("loan.splitChart");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);
  const data = buildSplitData(schedule);

  if (data.length === 0) {
    return (
      <ChartCard title={t("title")} description={t("description")}>
        <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={t("title")} description={t("description")} height={320}>
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
            <SplitTooltip
              currency={currency}
              localeTag={localeTag}
              principalLabel={t("principal")}
              interestLabel={t("interest")}
            />
          }
        />
        <Legend
          formatter={(value: string) =>
            value === "principal" ? t("principal") : t("interest")
          }
        />
        <Area
          type="monotone"
          dataKey="principal"
          stackId="1"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.6}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="interest"
          stackId="1"
          stroke="#f59e0b"
          fill="#f59e0b"
          fillOpacity={0.6}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartCard>
  );
}
