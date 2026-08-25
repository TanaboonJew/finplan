"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { detectConflicts } from "@/lib/finance/timeline";
import type { Goal } from "@/lib/storage/timeline-store";
import {
  formatMoney,
  localeTagOf,
} from "@/components/tools/timeline/timeline-format";
import { useLocale } from "next-intl";

interface ConflictAlertsProps {
  goals: Goal[];
  monthlyBudget: number;
  currency: string;
}

export function ConflictAlerts({
  goals,
  monthlyBudget,
  currency,
}: ConflictAlertsProps) {
  const t = useTranslations("timeline.conflicts");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  const conflicts = detectConflicts(goals, monthlyBudget);

  if (conflicts.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="mt-2 text-xs text-muted-foreground">{t("none")}</p>
      </section>
    );
  }

  const goalMap = new Map(goals.map((g) => [g.id, g]));

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
          {t("title")}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("description")}
        </p>
      </header>
      <div className="space-y-2">
        {conflicts.map((conflict, index) => {
          const goalA = goalMap.get(conflict.goalA);
          const goalB = goalMap.get(conflict.goalB);
          if (!goalA || !goalB) return null;

          const money = (amount: number) =>
            formatMoney(amount, localeTag, currency);

          return (
            <div
              key={`${conflict.goalA}-${conflict.goalB}-${index}`}
              className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-900/20"
            >
              <p className="text-sm font-medium">
                {t("between", {
                  a: goalA.name,
                  b: goalB.name,
                })}
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                <p>
                  {t("overlapPeriod", {
                    start: conflict.overlapStart,
                    end: conflict.overlapEnd,
                  })}
                </p>
                <p>
                  {t("demandOverBudget", {
                    demand: money(conflict.monthlyDemand),
                    budget: money(monthlyBudget),
                  })}
                </p>
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  {t("gapAmount", { amount: money(conflict.gap) })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
