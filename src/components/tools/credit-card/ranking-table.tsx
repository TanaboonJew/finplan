"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import type { CardComparisonResult } from "@/lib/finance/credit-card";
import { useMoney } from "./credit-card-format";

interface RankingTableProps {
  results: CardComparisonResult[];
}

export function RankingTable({ results }: RankingTableProps) {
  const t = useTranslations("credit-card.ranking");
  const money = useMoney();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (results.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <div className="mt-4 flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("emptyBody")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-2 font-medium">#</th>
              <th className="pb-2 pr-2 font-medium">{t("colCard")}</th>
              <th className="pb-2 pr-2 text-right font-medium">{t("colRewards")}</th>
              <th className="pb-2 pr-2 text-right font-medium">{t("colFee")}</th>
              <th className="pb-2 pr-2 text-right font-medium">{t("colBonus")}</th>
              <th className="pb-2 pr-2 text-right font-medium">{t("colNet")}</th>
              <th className="pb-2 text-right font-medium">{t("colEffRate")}</th>
              <th className="pb-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => {
              const isExpanded = expandedId === result.cardId;
              const isFirst = index === 0;
              return (
                <ResultRow
                  key={result.cardId}
                  result={result}
                  rank={index + 1}
                  isFirst={isFirst}
                  isExpanded={isExpanded}
                  onToggle={() =>
                    setExpandedId(isExpanded ? null : result.cardId)
                  }
                  money={money}
                  t={t}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-md border border-border p-3">
        <h4 className="text-xs font-semibold">{t("barTitle")}</h4>
        <div className="mt-2 flex flex-col gap-2">
          {results.map((result) => {
            const maxNet = Math.max(
              ...results.map((r) => Math.abs(r.netAnnualValue)),
              1
            );
            const width = Math.max(
              0,
              Math.min(100, (Math.abs(result.netAnnualValue) / maxNet) * 100)
            );
            return (
              <div key={result.cardId} className="flex items-center gap-2">
                <span className="w-36 shrink-0 truncate text-xs text-muted-foreground">
                  {result.cardName}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                  <div
                    className={`h-full rounded ${
                      result.netAnnualValue >= 0
                        ? "bg-emerald-500"
                        : "bg-red-400"
                    }`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-xs tabular-nums">
                  {money.currency(result.netAnnualValue)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ResultRow({
  result,
  rank,
  isFirst,
  isExpanded,
  onToggle,
  money,
  t,
}: {
  result: CardComparisonResult;
  rank: number;
  isFirst: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  money: ReturnType<typeof useMoney>;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <tr
        className={`border-b border-border ${
          isFirst ? "bg-emerald-500/5" : ""
        }`}
      >
        <td className="py-2 pr-2 tabular-nums">
          {isFirst ? (
            <Trophy className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <span className="text-muted-foreground">{rank}</span>
          )}
        </td>
        <td className="py-2 pr-2 font-medium">{result.cardName}</td>
        <td className="py-2 pr-2 text-right tabular-nums">
          {money.currency(result.annualRewardValue)}
        </td>
        <td className="py-2 pr-2 text-right tabular-nums text-muted-foreground">
          {result.totalFees > 0 ? money.currency(result.totalFees) : "—"}
        </td>
        <td className="py-2 pr-2 text-right tabular-nums text-muted-foreground">
          {result.signupBonus > 0 ? money.currency(result.signupBonus) : "—"}
        </td>
        <td
          className={`py-2 pr-2 text-right font-semibold tabular-nums ${
            result.netAnnualValue >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {money.currency(result.netAnnualValue)}
        </td>
        <td className="py-2 text-right tabular-nums text-muted-foreground">
          {money.rate(result.effectiveRate)}
        </td>
        <td className="py-2">
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="px-2 pb-2">
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("rewardBreakdown")}
              </p>
              <div className="mt-1 flex flex-col gap-1">
                {result.rewardsByCategory.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground">
                      {cat.categoryId}
                    </span>
                    <span className="tabular-nums">
                      {money.currency(cat.spend)} × {(cat.rate * 100).toFixed(1)}% ={" "}
                      {money.currency(cat.rewardValue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
