"use client";

import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { formatMoney } from "@/components/tools/tax/tax-format";

export interface TakeHomeChartProps {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  totalTax: number;
  takeHome: number;
  currency: string;
  localeTag: string;
}

export function TakeHomeChart({
  grossIncome,
  totalDeductions,
  totalTax,
  takeHome,
  currency,
  localeTag,
}: TakeHomeChartProps) {
  const t = useTranslations("tax.chart");

  const data = [
    {
      name: t("barGross"),
      value: grossIncome,
      fill: "#6366f1",
    },
    {
      name: t("barDeductions"),
      value: totalDeductions,
      fill: "#f59e0b",
    },
    {
      name: t("barTax"),
      value: totalTax,
      fill: "#ef4444",
    },
    {
      name: t("barTakeHome"),
      value: takeHome,
      fill: "#10b981",
    },
  ];

  if (grossIncome <= 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="flex h-48 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
          {t("empty")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <div className="h-64 rounded-lg border border-border bg-card p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) =>
                formatMoney(Number(value), localeTag, currency)
              }
              cursor={false}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value) =>
                  formatMoney(Number(value), localeTag, currency)
                }
                style={{ fontSize: 11, fill: "var(--foreground)" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
