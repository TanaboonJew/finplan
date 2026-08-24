"use client";

import { useTranslations } from "next-intl";
import { Flame, PiggyBank, Scale, CalendarClock } from "lucide-react";
import {
  StatCard,
  type StatCardTone,
} from "@/components/shared/stat-card";
import { formatMoney } from "@/components/tools/retirement/retirement-format";
import type { ProjectionResult } from "@/components/tools/retirement/projection";

export interface RetirementStatsProps {
  result: ProjectionResult;
  currency: string;
  localeTag: string;
  retirementAge: number;
  monthlyContribution: number;
  withdrawalRate: number;
}

export function RetirementStats({
  result,
  currency,
  localeTag,
  retirementAge,
  monthlyContribution,
  withdrawalRate,
}: RetirementStatsProps) {
  const t = useTranslations("retirement.stats");
  const money = (amount: number) => formatMoney(amount, localeTag, currency);
  const rate = new Intl.NumberFormat(localeTag, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(withdrawalRate);

  const base = result.scenarios.base;
  const onTrack = result.gap >= 0;
  const gapTone: StatCardTone = onTrack ? "positive" : "negative";
  const needed =
    !onTrack && result.neededMonthlyContribution !== null
      ? result.neededMonthlyContribution
      : null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={<Flame className="size-4" aria-hidden />}
        label={t("fireNumber")}
        value={money(base.fireTarget)}
        sublabel={t("fireNumberSub", {
          income: money(base.expenseAtRetirement),
          rate,
        })}
      />
      <StatCard
        icon={<PiggyBank className="size-4" aria-hidden />}
        label={t("projected", { age: retirementAge })}
        value={money(result.projectedBalance)}
        sublabel={t("projectedSub", {
          amount: money(result.realProjectedBalance),
        })}
      />
      <StatCard
        icon={<Scale className="size-4" aria-hidden />}
        tone={gapTone}
        label={onTrack ? t("surplus") : t("shortfall")}
        value={money(Math.abs(result.gap))}
        sublabel={
          result.fiAge !== null
            ? t("fiAge", { age: result.fiAge })
            : t("offTrack", { age: retirementAge })
        }
      />
      <StatCard
        icon={<CalendarClock className="size-4" aria-hidden />}
        label={t("neededMonthly")}
        value={money(needed ?? monthlyContribution)}
        sublabel={
          needed !== null
            ? t("neededMonthlySub", { current: money(monthlyContribution) })
            : t("savingEnough")
        }
      />
    </div>
  );
}
