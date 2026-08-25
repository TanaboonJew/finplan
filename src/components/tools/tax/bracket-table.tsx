"use client";

import { useTranslations } from "next-intl";
import type { TaxBandComputation } from "@/lib/finance/tax";
import { formatMoney, formatPercent } from "@/components/tools/tax/tax-format";

export interface BracketTableProps {
  bands: TaxBandComputation[];
  currency: string;
  localeTag: string;
}

function bandUpperBound(bands: TaxBandComputation[], index: number): number | null {
  let running = 0;
  for (let i = 0; i <= index; i++) {
    running += bands[i].taxableAmount;
  }
  if (index === bands.length - 1) return null;
  return running;
}

function bandLowerBound(bands: TaxBandComputation[], index: number): number {
  let running = 0;
  for (let i = 0; i < index; i++) {
    running += bands[i].taxableAmount;
  }
  return running;
}

export function BracketTable({
  bands,
  currency,
  localeTag,
}: BracketTableProps) {
  const t = useTranslations("tax.bracket");

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                {t("colRate")}
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                {t("colRange")}
              </th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                {t("colTaxable")}
              </th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                {t("colTax")}
              </th>
            </tr>
          </thead>
          <tbody>
            {bands.map((band, i) => {
              const lower = bandLowerBound(bands, i);
              const upper = bandUpperBound(bands, i);
              const isActive = band.taxableAmount > 0;
              const isMarginal =
                isActive && i === bands.length - 1;

              return (
                <tr
                  key={`${band.rate}-${i}`}
                  className={`border-b border-border last:border-b-0 ${
                    isMarginal
                      ? "bg-emerald-500/5 dark:bg-emerald-500/10"
                      : ""
                  }`}
                >
                  <td className="px-4 py-2 font-medium tabular-nums">
                    {formatPercent(band.rate)}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {upper === null
                      ? t("rangeOpen", {
                          from: formatMoney(lower, localeTag, currency),
                        })
                      : t("rangeClosed", {
                          from: formatMoney(lower, localeTag, currency),
                          to: formatMoney(upper, localeTag, currency),
                        })}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {isActive
                      ? formatMoney(band.taxableAmount, localeTag, currency)
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {isActive
                      ? formatMoney(band.tax, localeTag, currency)
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
