"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowRightLeft, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { MoneyInput } from "@/components/shared/money-input";
import { PercentInput } from "@/components/tools/loan/percent-input";
import { TextField } from "@/components/tools/loan/text-field";
import type { RefinanceBreakEvenResult } from "@/lib/finance/refinance";
import {
  formatMoney,
  localeTagOf,
} from "@/components/tools/loan/loan-format";

export interface RefinancePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  newAnnualRate: number;
  closingCost: number;
  newTermMonths: number;
  onNewAnnualRateChange: (rate: number) => void;
  onClosingCostChange: (cost: number) => void;
  onNewTermMonthsChange: (months: number) => void;
  result: RefinanceBreakEvenResult | null;
  currency: string;
}

export function RefinancePanel({
  isOpen,
  onToggle,
  newAnnualRate,
  closingCost,
  newTermMonths,
  onNewAnnualRateChange,
  onClosingCostChange,
  onNewTermMonthsChange,
  result,
  currency,
}: RefinancePanelProps) {
  const t = useTranslations("loan.refinance");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <ArrowRightLeft
          className="size-4 text-muted-foreground"
          aria-hidden
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          <p className="text-xs text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          {isOpen ? "−" : "+"}
        </Button>
      </header>

      {isOpen ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PercentInput
              label={t("newAprLabel")}
              value={newAnnualRate || null}
              onChange={(value) => onNewAnnualRateChange(value ?? 0)}
            />
            <MoneyInput
              label={t("closingCostLabel")}
              value={closingCost || null}
              onChange={(value) => onClosingCostChange(value ?? 0)}
              currency={currency}
              placeholder="0"
            />
            <div className="flex w-full flex-col gap-1.5">
              <TextField
                label={t("newTermLabel")}
                value={String(newTermMonths)}
                onChange={(event) => {
                  const parsed = parseInt(event.target.value, 10);
                  onNewTermMonthsChange(
                    Number.isFinite(parsed) ? parsed : 0
                  );
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t("newTermHint")}
              </p>
            </div>
          </div>

          {result !== null ? (
            result.breakEvenMonths === null ? (
              <div
                role="status"
                className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p>{t("breakEvenNever")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard
                  label={t("monthlySaving")}
                  value={formatMoney(result.monthlySaving, localeTag, currency)}
                  tone={result.monthlySaving > 0 ? "positive" : "negative"}
                />
                <StatCard
                  label={t("breakEven")}
                  value={`${result.breakEvenMonths}`}
                  sublabel={t("breakEvenSub")}
                  tone={result.breakEvenMonths > 0 ? "positive" : "default"}
                />
                <StatCard
                  label={t("totalSavings")}
                  value={formatMoney(
                    result.totalSavingsOverNewTerm,
                    localeTag,
                    currency
                  )}
                  sublabel={t("totalSavingsSub")}
                  tone={
                    result.totalSavingsOverNewTerm > 0
                      ? "positive"
                      : "negative"
                  }
                />
              </div>
            )
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
