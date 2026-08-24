"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type {
  PayoffResult,
  PayoffStrategy,
} from "@/lib/finance/payoff";
import { PAYOFF_STRATEGIES } from "@/lib/finance/payoff";
import {
  addMonthsToMonth,
  formatMoney,
  formatMonthYear,
} from "@/components/tools/debt/debt-format";

export interface StrategyComparisonProps {
  results: Partial<Record<PayoffStrategy, PayoffResult>>;
  selected: PayoffStrategy;
  onSelect: (strategy: PayoffStrategy) => void;
  startMonth: string;
  currency: string;
  localeTag: string;
}

export function StrategyComparison({
  results,
  selected,
  onSelect,
  startMonth,
  currency,
  localeTag,
}: StrategyComparisonProps) {
  const t = useTranslations("debt.strategies");

  const available = PAYOFF_STRATEGIES.filter(
    (strategy) => results[strategy] !== undefined
  );
  if (available.length === 0) return null;

  const cheapestInterest = Math.min(
    ...available.map((strategy) => results[strategy]!.totalInterest)
  );

  return (
    <section aria-label={t("selectHint")} className="space-y-2">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {available.map((strategy) => {
          const result = results[strategy]!;
          const isSelected = strategy === selected;
          const delta = result.totalInterest - cheapestInterest;
          const debtFreeMonth =
            result.monthsToPayoff === 0
              ? startMonth
              : addMonthsToMonth(startMonth, result.monthsToPayoff - 1);

          return (
            <button
              key={strategy}
              type="button"
              onClick={() => onSelect(strategy)}
              aria-pressed={isSelected}
              className={cn(
                "rounded-lg border bg-card p-4 text-start shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{t(strategy)}</h3>
                {delta === 0 ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    {t("cheapest")}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t(`${strategy}Hint`)}
              </p>
              <p className="mt-3 text-2xl font-semibold tabular-nums">
                {t("monthsTotal", { count: result.monthsToPayoff })}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("paidOffBy", {
                  date: formatMonthYear(debtFreeMonth, localeTag),
                })}
              </p>
              <dl className="mt-3 space-y-1 border-t border-border pt-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">{t("totalInterest")}</dt>
                  <dd className="text-end">
                    <span className="block font-medium tabular-nums">
                      {formatMoney(result.totalInterest, localeTag, currency)}
                    </span>
                    {delta > 0 ? (
                      <span className="block text-xs text-red-600 tabular-nums dark:text-red-400">
                        {t("deltaVsCheapest", {
                          amount: formatMoney(delta, localeTag, currency),
                        })}
                      </span>
                    ) : null}
                  </dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{t("selectHint")}</p>
    </section>
  );
}
