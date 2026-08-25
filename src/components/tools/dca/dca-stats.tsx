"use client";

import { useLocale, useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import type { DcaFundResult } from "@/lib/finance/dca";
import {
  formatMoney,
  formatPercent,
  localeTagOf,
} from "@/components/tools/dca/dca-format";

export interface DcaStatsProps {
  results: DcaFundResult[];
  currency: string;
}

export function DcaStats({ results, currency }: DcaStatsProps) {
  const t = useTranslations("dca.stats");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  if (results.length === 0) return null;

  const bestIndex = results.reduce(
    (best, r, i) => (r.endingBalance > results[best].endingBalance ? i : best),
    0
  );

  return (
    <div className="space-y-3">
      {results.map((result, index) => (
        <div key={result.fund.name} className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold">{result.fund.name}</span>
            {index === bestIndex && results.length > 1 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Trophy className="size-3" aria-hidden />
                {t("bestPerformer")}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label={t("endingBalance")}
              value={formatMoney(result.endingBalance, localeTag, currency)}
              sublabel={t("endingBalanceSub", { months: result.schedule.length - 1 })}
              tone={index === bestIndex ? "positive" : "default"}
            />
            <StatCard
              label={t("totalInvested")}
              value={formatMoney(result.totalInvested, localeTag, currency)}
            />
            <StatCard
              label={t("totalFees")}
              value={formatMoney(result.totalFees, localeTag, currency)}
              tone="negative"
            />
            <StatCard
              label={t("feeDrag")}
              value={formatPercent(result.feeDragPercent / 100)}
              sublabel={t("feeDragSub")}
              tone={result.feeDragPercent > 15 ? "negative" : "default"}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
