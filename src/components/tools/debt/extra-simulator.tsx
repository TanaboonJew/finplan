"use client";

import { useLocale, useTranslations } from "next-intl";
import { Rocket } from "lucide-react";
import { MoneyInput } from "@/components/shared/money-input";
import type {
  PayoffResult,
  PayoffStrategy,
} from "@/lib/finance/payoff";
import {
  formatMoney,
  localeTagOf,
} from "@/components/tools/debt/debt-format";

export interface ExtraSimulatorProps {
  extraMonthlyPayment: number;
  onExtraChange: (value: number | null) => void;
  strategy: PayoffStrategy;
  baselineResult: PayoffResult | null;
  currentResult: PayoffResult | null;
  maxExtra: number;
  currency: string;
}

export function ExtraSimulator({
  extraMonthlyPayment,
  onExtraChange,
  strategy,
  baselineResult,
  currentResult,
  maxExtra,
  currency,
}: ExtraSimulatorProps) {
  const t = useTranslations("debt.simulator");
  const ts = useTranslations("debt.strategies");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  if (baselineResult === null || currentResult === null) return null;

  const monthsSaved = baselineResult.monthsToPayoff - currentResult.monthsToPayoff;
  const interestSaved = baselineResult.totalInterest - currentResult.totalInterest;
  const hasSaving =
    monthsSaved > 0 ||
    Math.round(interestSaved * 100) > 0;
  const sliderMax = Math.max(maxExtra, 100);

  return (
    <section
      data-slot="extra-simulator"
      className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <header className="flex items-start gap-2">
        <Rocket className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </header>

      <div className="mt-4">
        <MoneyInput
          label={t("label")}
          currency={currency}
          value={extraMonthlyPayment}
          min={0}
          onChange={(value) =>
            onExtraChange(value === null ? null : Math.max(0, value))
          }
        />
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={5}
          value={Math.min(extraMonthlyPayment, sliderMax)}
          aria-label={t("label")}
          onChange={(event) => onExtraChange(Number(event.target.value))}
          className="mt-3 w-full accent-emerald-600 dark:accent-emerald-400"
        />
      </div>

      <div className="mt-4 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm">
        <p className="text-xs text-muted-foreground">{ts(strategy)}</p>
        {hasSaving ? (
          <ul className="mt-1 space-y-0.5">
            {monthsSaved > 0 ? (
              <li className="font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                {t("savedMonths", { count: monthsSaved })}
              </li>
            ) : null}
            {Math.round(interestSaved * 100) > 0 ? (
              <li className="font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                {t("savedInterest", {
                  amount: formatMoney(interestSaved, localeTag, currency),
                })}
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("noSaving")}
          </p>
        )}
      </div>
    </section>
  );
}
