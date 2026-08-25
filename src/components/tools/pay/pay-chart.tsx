"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { Subscription } from "@/lib/storage/pay-store";
import { formatMoney, localeTagOf } from "@/components/tools/pay/pay-format";

interface PayChartProps {
  subscriptions: Subscription[];
  currency: string;
  locale: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  streaming: "#10b981",
  music: "#8b5cf6",
  cloud: "#3b82f6",
  software: "#f59e0b",
  fitness: "#ef4444",
  shopping: "#ec4899",
  news: "#6366f1",
  gaming: "#14b8a6",
  education: "#f97316",
  other: "#6b7280",
};

function getDefaultColor(index: number): string {
  const palette = [
    "#10b981", "#8b5cf6", "#3b82f6", "#f59e0b", "#ef4444",
    "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#6b7280",
  ];
  return palette[index % palette.length]!;
}

export function PayChart({ subscriptions, currency, locale }: PayChartProps) {
  const t = useTranslations("pay.chart");
  const localeTag = localeTagOf(locale);

  const data = useMemo(() => {
    const categoryMap = new Map<string, number>();
    for (const sub of subscriptions) {
      if (!sub.active) continue;
      const monthly =
        sub.cycle === "yearly" ? sub.amount / 12 : sub.amount;
      const current = categoryMap.get(sub.category) ?? 0;
      categoryMap.set(sub.category, current + monthly);
    }
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [subscriptions]);

  const hasData = data.length > 0;

  return (
    <ChartCard
      title={t("title")}
      description={t("description")}
      height={280}
    >
      {!hasData ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(props) => {
                const name = String(props.name ?? "");
                const percent = Number(props.percent ?? 0);
                return `${name} ${(percent * 100).toFixed(0)}%`;
              }}
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={CATEGORY_COLORS[entry.name] ?? getDefaultColor(i)}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                formatMoney(Number(value ?? 0), localeTag, currency) + "/mo"
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
