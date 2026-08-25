"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { CardResult } from "@/lib/finance/travel-card";
import {
  formatMoney,
  localeTagOf,
} from "@/components/tools/travel-card/travel-card-format";

const COLORS = {
  fxFee: "#ef4444",
  fxMarkup: "#f97316",
  reward: "#22c55e",
  vatRefund: "#06b6d4",
  annualFee: "#a855f7",
};

export interface TravelCardCostChartProps {
  cardResults: CardResult[];
  currency: string;
}

export function TravelCardCostChart({
  cardResults,
  currency,
}: TravelCardCostChartProps) {
  const t = useTranslations("travel-card.chart");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  if (cardResults.length === 0) return null;

  const data = cardResults.map((cr) => ({
    name: cr.card.name,
    fxFee: cr.result.fxFee,
    fxMarkup: cr.result.fxMarkup,
    reward: cr.result.foreignReward,
    vatRefund: cr.result.vatRefund,
    annualFee: cr.result.annualFeeProrated,
  }));

  return (
    <ChartCard
      title={t("title")}
      description={t("description")}
      height={300}
    >
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, name) => [
            formatMoney(Number(value), localeTag, currency),
            String(name),
          ]}
        />
        <Legend />
        <Bar dataKey="fxFee" stackId="cost" fill={COLORS.fxFee} name={t("fxFee")} />
        <Bar dataKey="fxMarkup" stackId="cost" fill={COLORS.fxMarkup} name={t("fxMarkup")} />
        <Bar dataKey="annualFee" stackId="cost" fill={COLORS.annualFee} name={t("annualFee")} />
        <Bar dataKey="reward" stackId="benefit" fill={COLORS.reward} name={t("reward")} />
        <Bar dataKey="vatRefund" stackId="benefit" fill={COLORS.vatRefund} name={t("vatRefund")} />
      </BarChart>
    </ChartCard>
  );
}
