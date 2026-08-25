"use client";

import { useLocale, useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import type { CardResult } from "@/lib/finance/travel-card";
import {
  formatMoney,
  localeTagOf,
} from "@/components/tools/travel-card/travel-card-format";

export interface TravelCardResultsProps {
  cardResults: CardResult[];
  bestCardIndex: number;
  currency: string;
}

export function TravelCardResults({
  cardResults,
  bestCardIndex,
  currency,
}: TravelCardResultsProps) {
  const t = useTranslations("travel-card.results");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  if (cardResults.length === 0) return null;

  const worstNetCost = Math.max(
    ...cardResults.map((cr) => cr.result.netTripCost)
  );
  const bestNetCost = cardResults[bestCardIndex].result.netTripCost;
  const totalSavings = worstNetCost - bestNetCost;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-semibold">{t("bestCard")}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Trophy className="size-3" aria-hidden />
            {cardResults[bestCardIndex].card.name}
          </span>
        </div>
        {totalSavings > 0 && cardResults.length > 1 ? (
          <p className="text-xs text-muted-foreground">
            {t("savingsVsWorst", {
              amount: formatMoney(totalSavings, localeTag, currency),
            })}
          </p>
        ) : null}
      </div>

      {cardResults.map((cr, index) => (
        <div
          key={cr.card.id}
          className="rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold">{cr.card.name}</span>
            {index === bestCardIndex && cardResults.length > 1 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Trophy className="size-3" aria-hidden />
                {t("best")}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label={t("netTripCost")}
              value={formatMoney(cr.result.netTripCost, localeTag, currency)}
              tone={index === bestCardIndex ? "positive" : "default"}
            />
            <StatCard
              label={t("fxCost")}
              value={formatMoney(cr.result.totalFxCost, localeTag, currency)}
              tone={cr.result.totalFxCost > 0 ? "negative" : "default"}
            />
            <StatCard
              label={t("rewards")}
              value={formatMoney(
                cr.result.foreignReward + cr.result.vatRefund,
                localeTag,
                currency
              )}
              tone={
                cr.result.foreignReward + cr.result.vatRefund > 0
                  ? "positive"
                  : "default"
              }
            />
            <StatCard
              label={t("annualFee")}
              value={formatMoney(
                cr.result.annualFeeProrated,
                localeTag,
                currency
              )}
              tone={cr.result.annualFeeProrated > 0 ? "negative" : "default"}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
