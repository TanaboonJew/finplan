"use client";

import { useTranslations } from "next-intl";
import { Target, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { StatCard, type StatCardTone } from "@/components/shared/stat-card";
import {
  detectConflicts,
  totalMonthlyDemand,
  goalNominalCost,
  goalProjectedSavings,
  goalShortfall,
} from "@/lib/finance/timeline";
import type { Goal } from "@/lib/storage/timeline-store";
import {
  formatMoney,
  localeTagOf,
} from "@/components/tools/timeline/timeline-format";
import { useLocale } from "next-intl";

interface TimelineStatsProps {
  goals: Goal[];
  monthlyBudget: number;
  currentAge: number;
  currency: string;
}

export function TimelineStats({
  goals,
  monthlyBudget,
  currentAge,
  currency,
}: TimelineStatsProps) {
  const t = useTranslations("timeline.stats");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);
  const money = (amount: number) => formatMoney(amount, localeTag, currency);

  const conflicts = detectConflicts(goals, monthlyBudget);
  const demand = totalMonthlyDemand(goals, currentAge);
  const utilization =
    monthlyBudget > 0
      ? Math.min(100, Math.round((demand / monthlyBudget) * 100))
      : 0;

  let shortfallCount = 0;
  for (const goal of goals) {
    const nominalCost = goalNominalCost(goal, currentAge);
    const projected = goalProjectedSavings(goal, currentAge);
    if (goalShortfall(projected, nominalCost) > 0) {
      shortfallCount += 1;
    }
  }

  const utilizationTone: StatCardTone =
    utilization > 100
      ? "negative"
      : utilization > 80
        ? "default"
        : "positive";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={<Target className="size-4" aria-hidden />}
        label={t("goalsLabel")}
        value={String(goals.length)}
        sublabel={
          conflicts.length > 0
            ? `${conflicts.length} conflict${conflicts.length > 1 ? "s" : ""}`
            : undefined
        }
        tone={conflicts.length > 0 ? "negative" : undefined}
      />
      <StatCard
        icon={<DollarSign className="size-4" aria-hidden />}
        label={t("budgetDemandLabel")}
        value={`${money(demand)}/mo`}
        sublabel={`${money(monthlyBudget)}/mo budget`}
      />
      <StatCard
        icon={<AlertTriangle className="size-4" aria-hidden />}
        label={t("utilizationLabel")}
        value={`${utilization}%`}
        tone={utilizationTone}
      />
      <StatCard
        icon={<CheckCircle className="size-4" aria-hidden />}
        label={t("shortfallLabel")}
        value={
          goals.length === 0 ? t("noGoals") : String(shortfallCount)
        }
        sublabel={
          goals.length > 0
            ? shortfallCount > 0
              ? t("shortfallSub", {
                  count: shortfallCount,
                  total: goals.length,
                })
              : t("noShortfall")
            : undefined
        }
        tone={shortfallCount > 0 ? "negative" : "positive"}
      />
    </div>
  );
}
