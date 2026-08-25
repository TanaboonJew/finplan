"use client";

import { useTranslations } from "next-intl";
import { Scale } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import type { DcaFundResult } from "@/lib/finance/dca";
import { computeBreakevenHorizon } from "@/lib/finance/dca";
import { monthsToYears } from "@/components/tools/dca/dca-format";

export interface DcaBreakevenProps {
  results: readonly DcaFundResult[];
  monthlyContribution: number;
}

export function DcaBreakeven({ results, monthlyContribution }: DcaBreakevenProps) {
  const t = useTranslations("dca.breakeven");

  if (results.length !== 2) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("noComparison")}
        </p>
      </div>
    );
  }

  const [fundA, fundB] = results;
  const maxMonths = fundA.schedule.length - 1;

  const breakevenMonth = computeBreakevenHorizon(
    fundA.fund,
    fundB.fund,
    monthlyContribution,
    maxMonths
  );

  const otherWay = computeBreakevenHorizon(
    fundB.fund,
    fundA.fund,
    monthlyContribution,
    maxMonths
  );

  const actualMonth = breakevenMonth ?? otherWay;

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{t("description")}</p>
      <div className="mt-3">
        {actualMonth !== null ? (
          <StatCard
            label={t("monthLabel", { month: actualMonth })}
            value={t("yearLabel", { years: monthsToYears(actualMonth) })}
            sublabel={t("winnerLabel")}
            tone="positive"
            icon={<Scale className="size-4" aria-hidden />}
          />
        ) : (
          <StatCard
            label={t("neverLabel")}
            value="—"
            icon={<Scale className="size-4" aria-hidden />}
          />
        )}
      </div>
    </div>
  );
}
