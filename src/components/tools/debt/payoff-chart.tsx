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
import type {
  PayoffResult,
  PayoffStrategy,
} from "@/lib/finance/payoff";
import { PAYOFF_STRATEGIES } from "@/lib/finance/payoff";
import { formatCompactCurrency } from "@/lib/finance/format";
import {
  addMonthsToMonth,
  formatMoney,
  formatMonthYear,
  localeTagOf,
} from "@/components/tools/debt/debt-format";

const STRATEGY_COLORS: Record<PayoffStrategy, string> = {
  snowball: "#f59e0b",
  avalanche: "#10b981",
  hybrid: "#0ea5e9",
};

interface ChartPoint {
  month: number;
  date: string;
  snowball: number | null;
  avalanche: number | null;
  hybrid: number | null;
}

function buildSeries(
  results: Partial<Record<PayoffStrategy, PayoffResult>>,
  startMonth: string
): ChartPoint[] {
  const longest = Math.max(
    0,
    ...PAYOFF_STRATEGIES.map(
      (strategy) => results[strategy]?.monthsToPayoff ?? 0
    )
  );
  const points: ChartPoint[] = [];
  for (let index = 0; index < longest; index += 1) {
    const month = index + 1;
    const point: ChartPoint = {
      month,
      date: formatMonthYear(addMonthsToMonth(startMonth, index), "en-US"),
      snowball: null,
      avalanche: null,
      hybrid: null,
    };
    for (const strategy of PAYOFF_STRATEGIES) {
      const result = results[strategy];
      if (!result) continue;
      point[strategy] =
        index < result.monthly.length ? result.monthly[index].totalBalance : 0;
    }
    points.push(point);
  }
  return points;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string | number;
    value?: number | string | Array<number | string>;
    color?: string;
    payload?: ChartPoint;
  }>;
  currency: string;
  localeTag: string;
  monthHeader: (month: number, date: string) => React.ReactNode;
}

function ChartTooltip({
  active,
  payload,
  currency,
  localeTag,
  monthHeader,
}: ChartTooltipProps) {
  if (active !== true || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {point ? (
        <p className="font-medium">{monthHeader(point.month, point.date)}</p>
      ) : null}
      <div className="mt-1 space-y-0.5">
        {payload.map((item) => (
          <div
            key={String(item.dataKey)}
            className="flex items-center justify-between gap-4"
          >
            <span style={{ color: item.color }}>
              {item.name ?? item.dataKey}
            </span>
            <span className="tabular-nums">
              {typeof item.value === "number"
                ? formatMoney(item.value, localeTag, currency)
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface PayoffChartProps {
  results: Partial<Record<PayoffStrategy, PayoffResult>>;
  selected: PayoffStrategy;
  startMonth: string;
  currency: string;
}

export function PayoffChart({
  results,
  selected,
  startMonth,
  currency,
}: PayoffChartProps) {
  const t = useTranslations("debt.chart");
  const ts = useTranslations("debt.strategies");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);
  const series = buildSeries(results, startMonth);

  if (series.length === 0) return null;

  return (
    <ChartCard title={t("title")} description={t("description")} height={300}>
      <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          opacity={0.12}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickMargin={6}
          interval="preserveStartEnd"
          minTickGap={48}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(value: number) =>
            formatCompactCurrency(value, { locale: localeTag, currency })
          }
          width={64}
        />
        <Tooltip
          content={
            <ChartTooltip
              currency={currency}
              localeTag={localeTag}
              monthHeader={(month, date) =>
                `${t("tooltipMonth", { month })} · ${date}`
              }
            />
          }
        />
        <Legend formatter={(value) => ts(String(value) as PayoffStrategy)} />
        {PAYOFF_STRATEGIES.filter((strategy) => results[strategy] !== undefined)
          .sort((a, b) => (a === selected ? -1 : b === selected ? 1 : 0))
          .map((strategy) => (
            <Line
              key={strategy}
              type="monotone"
              dataKey={strategy}
              name={ts(strategy)}
              stroke={STRATEGY_COLORS[strategy]}
              strokeWidth={strategy === selected ? 2.5 : 1.5}
              strokeOpacity={strategy === selected ? 1 : 0.55}
              dot={false}
              isAnimationActive={false}
            />
          ))}
      </LineChart>
    </ChartCard>
  );
}
