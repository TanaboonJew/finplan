"use client";

import { useTranslations } from "next-intl";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/finance/format";

interface FlowStatsProps {
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  endingBalance: number;
  incomeCount: number;
  expenseCount: number;
  currency: string;
  locale: string;
}

export function FlowStats({
  totalIncome,
  totalExpense,
  netFlow,
  endingBalance,
  incomeCount,
  expenseCount,
  currency,
  locale,
}: FlowStatsProps) {
  const t = useTranslations("flow");

  const format = (v: number) =>
    formatCurrency(v, { currency, locale });

  const isPositive = netFlow >= 0;
  const runway =
    totalExpense > 0 && netFlow < 0
      ? Math.floor((endingBalance / totalExpense) * 100) / 100
      : null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label={t("stats.totalIncome")}
        value={format(totalIncome)}
        sublabel={t("stats.totalIncomeSub", { count: incomeCount })}
        tone="positive"
      />
      <StatCard
        label={t("stats.totalExpense")}
        value={format(totalExpense)}
        sublabel={t("stats.totalExpenseSub", { count: expenseCount })}
        tone="negative"
      />
      <StatCard
        label={t("stats.netFlow")}
        value={format(netFlow)}
        sublabel={t("stats.netFlowSub")}
        tone={isPositive ? "positive" : "negative"}
      />
      <StatCard
        label={t("stats.endingBalance")}
        value={format(endingBalance)}
        sublabel={
          runway !== null && runway >= 0
            ? `${Math.floor(runway)} ${t("stats.runwaySub")}`
            : t("stats.runwayPositive")
        }
        tone={endingBalance >= 0 ? "positive" : "negative"}
      />
    </div>
  );
}
