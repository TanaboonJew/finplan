"use client";

import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { MonthlyPoint } from "@/lib/finance/flow";
import { formatCurrency, formatCompactCurrency } from "@/lib/finance/format";

interface FlowBalanceChartProps {
  data: MonthlyPoint[];
  currency: string;
  locale: string;
}

export function FlowBalanceChart({
  data,
  currency,
  locale,
}: FlowBalanceChartProps) {
  const t = useTranslations("flow");

  if (data.length === 0) {
    return (
      <ChartCard
        title={t("balanceChart.title")}
        description={t("balanceChart.description")}
        height={200}
      >
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {t("balanceChart.empty")}
        </div>
      </ChartCard>
    );
  }

  const chartData = data.map((pt) => ({
    ...pt,
    label: pt.month,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function tooltipFormatter(value: any) {
    return [
      formatCurrency(Number(value), { currency, locale }),
      t("balanceChart.balance"),
    ];
  }

  return (
    <ChartCard
      title={t("balanceChart.title")}
      description={t("balanceChart.description")}
      height={280}
    >
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="hsl(142, 71%, 45%)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="hsl(142, 71%, 45%)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) =>
            formatCompactCurrency(v, { currency, locale })
          }
        />
        <Tooltip formatter={tooltipFormatter} />
        <ReferenceLine
          y={0}
          stroke="hsl(var(--foreground))"
          strokeDasharray="3 3"
          strokeOpacity={0.3}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="hsl(142, 71%, 45%)"
          fill="url(#balanceGradient)"
          strokeWidth={2}
          name={t("balanceChart.balance")}
        />
      </AreaChart>
    </ChartCard>
  );
}
