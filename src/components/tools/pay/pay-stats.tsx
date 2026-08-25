"use client";

import { useTranslations } from "next-intl";
import { StatCard } from "@/components/shared/stat-card";
import { formatMoney } from "@/components/tools/pay/pay-format";

interface PayStatsProps {
  monthlyTotal: number;
  annualTotal: number;
  activeCount: number;
  averagePerSub: number;
  currency: string;
  localeTag: string;
}

export function PayStats({
  monthlyTotal,
  annualTotal,
  activeCount,
  averagePerSub,
  currency,
  localeTag,
}: PayStatsProps) {
  const t = useTranslations("pay.stats");

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label={t("monthlyCost")}
        value={formatMoney(monthlyTotal, localeTag, currency)}
        sublabel={t("monthlyCostSub", { count: activeCount })}
      />
      <StatCard
        label={t("annualCost")}
        value={formatMoney(annualTotal, localeTag, currency)}
        sublabel={t("annualCostSub")}
      />
      <StatCard
        label={t("activeSubs")}
        value={`${activeCount}`}
        sublabel={t("activeSubsSub")}
      />
      <StatCard
        label={t("averagePerSub")}
        value={formatMoney(averagePerSub, localeTag, currency)}
        sublabel={t("averagePerSubSub")}
      />
    </div>
  );
}
