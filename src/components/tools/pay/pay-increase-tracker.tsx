"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import type { Subscription, PriceRecord } from "@/lib/storage/pay-store";
import { formatMoney, localeTagOf } from "@/components/tools/pay/pay-format";

interface PayIncreaseTrackerProps {
  subscriptions: Subscription[];
  currency: string;
  locale: string;
}

interface IncreaseEntry {
  name: string;
  original: PriceRecord;
  current: PriceRecord;
  delta: number;
  percentChange: number;
  increaseCount: number;
}

export function PayIncreaseTracker({
  subscriptions,
  currency,
  locale,
}: PayIncreaseTrackerProps) {
  const t = useTranslations("pay.increases");
  const localeTag = localeTagOf(locale);

  const entries = useMemo(() => {
    const result: IncreaseEntry[] = [];
    for (const sub of subscriptions) {
      if (sub.priceHistory.length < 2) continue;
      const sorted = [...sub.priceHistory].sort(
        (a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth)
      );
      const original = sorted[0]!;
      const current = sorted[sorted.length - 1]!;
      const delta = current.amount - original.amount;
      if (delta <= 0) continue;
      const percentChange =
        original.amount > 0 ? (delta / original.amount) * 100 : 0;
      result.push({
        name: sub.name,
        original,
        current,
        delta,
        percentChange,
        increaseCount: sorted.length - 1,
      });
    }
    return result.sort((a, b) => b.delta - a.delta);
  }, [subscriptions]);

  if (entries.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-5 text-amber-500" aria-hidden />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-2 font-medium">{t("colName")}</th>
              <th className="px-3 py-2 font-medium">{t("colOriginal")}</th>
              <th className="px-3 py-2 font-medium">{t("colCurrent")}</th>
              <th className="px-3 py-2 font-medium">{t("colIncrease")}</th>
              <th className="px-3 py-2 font-medium">{t("colPercent")}</th>
              <th className="px-3 py-2 font-medium">{t("colChanges")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.name} className="border-b last:border-b-0">
                <td className="px-3 py-2 font-medium">{e.name}</td>
                <td className="px-3 py-2 tabular-nums">
                  {formatMoney(e.original.amount, localeTag, currency)}
                  <span className="text-muted-foreground ml-1 text-xs">
                    ({e.original.effectiveMonth})
                  </span>
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {formatMoney(e.current.amount, localeTag, currency)}
                </td>
                <td className="px-3 py-2 tabular-nums text-amber-600 dark:text-amber-400">
                  +{formatMoney(e.delta, localeTag, currency)}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  +{e.percentChange.toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {e.increaseCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
