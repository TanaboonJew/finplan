"use client";

import { useTranslations } from "next-intl";
import {
  Bar,
  Tooltip,
  Legend,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { MonthlyPoint } from "@/lib/finance/flow";
import { formatCurrency, formatCompactCurrency } from "@/lib/finance/format";

interface FlowMonthlyChartProps {
  data: MonthlyPoint[];
  currency: string;
  locale: string;
}

export function FlowMonthlyChart({
  data,
  currency,
  locale,
}: FlowMonthlyChartProps) {
  const t = useTranslations("flow");

  if (data.length === 0) {
    return (
      <ChartCard
        title={t("monthlyChart.title")}
        description={t("monthlyChart.description")}
        height={200}
      >
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {t("monthlyChart.empty")}
        </div>
      </ChartCard>
    );
  }

  const chartData = data.map((pt) => ({
    ...pt,
    label: pt.month,
    income: pt.totalIncome,
    expense: pt.totalExpense,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function tooltipFormatter(value: any, name: any) {
    return [
      formatCurrency(Number(value), { currency, locale }),
      name === "income"
        ? t("monthlyChart.income")
        : name === "expense"
          ? t("monthlyChart.expense")
          : String(name),
    ];
  }

  return (
    <ChartCard
      title={t("monthlyChart.title")}
      description={t("monthlyChart.description")}
      height={280}
    >
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
        <Legend />
        <Bar
          dataKey="income"
          fill="hsl(142, 71%, 45%)"
          name={t("monthlyChart.income")}
          radius={[2, 2, 0, 0]}
        />
        <Bar
          dataKey="expense"
          fill="hsl(0, 84%, 60%)"
          name={t("monthlyChart.expense")}
          radius={[2, 2, 0, 0]}
        />
      </ComposedChart>
    </ChartCard>
  );
}
