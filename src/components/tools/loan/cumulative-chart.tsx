"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { AmortizationRow } from "@/lib/finance/amortization";
import { formatMoney, localeTagOf } from "@/components/tools/loan/loan-format";

interface CumulativePoint {
  month: number;
  principalPaid: number;
  interestPaid: number;
}

function buildCumulativeData(
  schedule: readonly AmortizationRow[]
): CumulativePoint[] {
  let cumPrincipal = 0;
  let cumInterest = 0;
  return schedule.map((row) => {
    cumPrincipal += row.principal + row.extraPrincipal;
    cumInterest += row.interest;
    return {
      month: row.month,
      principalPaid: Math.round(cumPrincipal * 100) / 100,
      interestPaid: Math.round(cumInterest * 100) / 100,
    };
  });
}

function findCrossoverMonth(data: readonly CumulativePoint[]): number | null {
  for (const point of data) {
    if (point.principalPaid >= point.interestPaid) return point.month;
  }
  return null;
}

interface CumulativeTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number;
    color?: string;
    payload?: CumulativePoint;
  }>;
  currency: string;
  localeTag: string;
  principalLabel: string;
  interestLabel: string;
}

function CumulativeTooltip({
  active,
  payload,
  currency,
  localeTag,
  principalLabel,
  interestLabel,
}: CumulativeTooltipProps) {
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
            {formatMoney(point.principalPaid, localeTag, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: "#f59e0b" }}>{interestLabel}</span>
          <span className="tabular-nums">
            {formatMoney(point.interestPaid, localeTag, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

export interface CumulativeChartProps {
  schedule: readonly AmortizationRow[];
  currency: string;
}

export function CumulativeChart({ schedule, currency }: CumulativeChartProps) {
  const t = useTranslations("loan.cumulativeChart");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);
  const data = buildCumulativeData(schedule);
  const crossoverMonth = findCrossoverMonth(data);

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
    <ChartCard
      title={t("title")}
      description={
        crossoverMonth !== null
          ? t("crossover", { month: crossoverMonth })
          : t("description")
      }
      height={300}
    >
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
            <CumulativeTooltip
              currency={currency}
              localeTag={localeTag}
              principalLabel={t("principalPaid")}
              interestLabel={t("interestPaid")}
            />
          }
        />
        <Legend
          formatter={(value: string) =>
            value === "principalPaid"
              ? t("principalPaid")
              : t("interestPaid")
          }
        />
        <Line
          type="monotone"
          dataKey="principalPaid"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="interestPaid"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartCard>
  );
}
