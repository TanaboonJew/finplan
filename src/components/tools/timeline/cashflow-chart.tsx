"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { combinedCashFlow } from "@/lib/finance/timeline";
import type { Goal } from "@/lib/storage/timeline-store";
import {
  formatMoney,
  localeTagOf,
} from "@/components/tools/timeline/timeline-format";

interface CashFlowChartProps {
  goals: Goal[];
  monthlyBudget: number;
  currentAge: number;
  currency: string;
}

interface ChartRow {
  age: number;
  budget: number;
  demand: number;
  balance: number;
}

function buildRows(goals: Goal[], monthlyBudget: number, currentAge: number): ChartRow[] {
  const result = combinedCashFlow(goals, monthlyBudget, currentAge);
  if (result.months.length === 0) return [];
  return result.months.map((m, i) => ({
    age: Math.round(m / 12 + currentAge),
    budget: result.budgetLine[i]!,
    demand: result.demandLine[i]!,
    balance: result.balanceLine[i]!,
  }));
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    value?: number;
    color?: string;
    payload?: ChartRow;
  }>;
  localeTag: string;
  currency: string;
  ageHeader: (age: number) => React.ReactNode;
}

function ChartTooltip({
  active,
  payload,
  localeTag,
  currency,
  ageHeader,
}: ChartTooltipProps) {
  if (active !== true || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{ageHeader(row.age)}</p>
      <div className="mt-1 space-y-0.5">
        {payload.map((item) => (
          <div
            key={String(item.dataKey)}
            className="flex items-center justify-between gap-4"
          >
            <span style={{ color: item.color }}>
              {String(item.dataKey)}
            </span>
            <span className="tabular-nums">
              {formatMoney(item.value ?? 0, localeTag, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CashFlowChart({
  goals,
  monthlyBudget,
  currentAge,
  currency,
}: CashFlowChartProps) {
  const t = useTranslations("timeline.cashflow");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  const rows = buildRows(goals, monthlyBudget, currentAge);

  if (rows.length === 0) {
    return (
      <ChartCard title={t("title")} description={t("description")} height={300}>
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={t("title")} description={t("description")} height={300}>
      <AreaChart
        data={rows}
        margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
      >
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          opacity={0.12}
        />
        <XAxis
          dataKey="age"
          tick={{ fontSize: 11 }}
          tickMargin={6}
          tickFormatter={(value: number) => String(value)}
          interval="preserveStartEnd"
          minTickGap={32}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(value: number) =>
            formatMoney(value, localeTag, currency)
          }
          width={64}
        />
        <Tooltip
          content={
            <ChartTooltip
              localeTag={localeTag}
              currency={currency}
              ageHeader={(age) => t("tooltipAge", { age })}
            />
          }
        />
        <Legend
          formatter={(value) => {
            const map: Record<string, string> = {
              budget: t("budgetLine"),
              demand: t("demandLine"),
              balance: t("balanceLine"),
            };
            return map[value] ?? value;
          }}
        />
        <Line
          type="monotone"
          dataKey="budget"
          stroke="#6366f1"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="demand"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartCard>
  );
}
