"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { formatCompactCurrency } from "@/lib/finance/format";
import type {
  ProjectionResult,
  ScenarioKey,
} from "@/components/tools/retirement/projection";
import { SCENARIO_KEYS } from "@/components/tools/retirement/projection";
import {
  formatMoney,
  localeTagOf,
} from "@/components/tools/retirement/retirement-format";

const SCENARIO_COLORS: Record<ScenarioKey, string> = {
  bear: "#ef4444",
  base: "#10b981",
  bull: "#0ea5e9",
};

interface ChartRow {
  age: number;
  bear: number;
  base: number;
  bull: number;
}

function buildRows(result: ProjectionResult): ChartRow[] {
  const length = result.scenarios.base.series.length;
  const rows: ChartRow[] = [];
  for (let index = 0; index < length; index += 1) {
    rows.push({
      age: result.scenarios.base.series[index]!.age,
      bear: result.scenarios.bear.series[index]!.balance,
      base: result.scenarios.base.series[index]!.balance,
      bull: result.scenarios.bull.series[index]!.balance,
    });
  }
  return rows;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string | number;
    value?: number | string | Array<number | string>;
    color?: string;
    payload?: ChartRow;
  }>;
  currency: string;
  localeTag: string;
  ageHeader: (age: number) => React.ReactNode;
}

function ChartTooltip({
  active,
  payload,
  currency,
  localeTag,
  ageHeader,
}: ChartTooltipProps) {
  if (active !== true || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {row ? <p className="font-medium">{ageHeader(row.age)}</p> : null}
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

export interface ProjectionChartProps {
  result: ProjectionResult;
  currency: string;
}

export function ProjectionChart({ result, currency }: ProjectionChartProps) {
  const t = useTranslations("retirement.chart");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);
  const rows = buildRows(result);

  if (rows.length === 0) return null;

  return (
    <ChartCard title={t("title")} description={t("description")} height={300}>
      <LineChart
        data={rows}
        margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
      >
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
            formatCompactCurrency(value, { locale: localeTag, currency })
          }
          width={64}
        />
        <Tooltip
          content={
            <ChartTooltip
              currency={currency}
              localeTag={localeTag}
              ageHeader={(age) => t("tooltipAge", { age })}
            />
          }
        />
        <Legend
          formatter={(value) => t(`legend.${String(value)}` as ScenarioKey)}
        />
        {SCENARIO_KEYS.map((scenario) => (
          <Line
            key={scenario}
            type="monotone"
            dataKey={scenario}
            name={t(`legend.${scenario}`)}
            stroke={SCENARIO_COLORS[scenario]}
            strokeWidth={scenario === "base" ? 2.5 : 1.5}
            strokeOpacity={scenario === "base" ? 1 : 0.7}
            dot={false}
            isAnimationActive={false}
          />
        ))}
        <ReferenceLine
          y={result.baseFireTarget}
          stroke="#a1a1aa"
          strokeDasharray="6 4"
          label={{
            value: t("fireLine"),
            position: "insideTopRight",
            fontSize: 11,
          }}
        />
      </LineChart>
    </ChartCard>
  );
}
