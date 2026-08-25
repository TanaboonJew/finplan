"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle } from "lucide-react";
import type { CoverageGap } from "@/lib/finance/insurance";
import { useMoney } from "./insurance-format";

interface GapChecklistProps {
  gaps: CoverageGap[];
}

export function GapChecklist({ gaps }: GapChecklistProps) {
  const t = useTranslations("insurance.gaps");
  const money = useMoney();

  if (gaps.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
      </section>
    );
  }

  const missingCount = gaps.filter((g) => !g.hasCoverage && g.recommended).length;

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-3">
        {missingCount === 0 ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {t("allCovered")}
          </p>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {t("gapsFound", { count: missingCount })}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {gaps.map((gap) => (
          <div
            key={gap.category}
            className="flex items-start gap-3 rounded-md border border-border p-3"
          >
            <span className="mt-0.5 shrink-0">
              {gap.hasCoverage ? (
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="size-5 text-red-500 dark:text-red-400" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium capitalize">
                  {gap.category.replace("-", " ")}
                </p>
                {gap.recommended && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {t("recommendedBadge")}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {gap.hasCoverage ? (
                  <>
                    {t("covered")} ·{" "}
                    {t("policyCount", { count: gap.policyCount })} ·{" "}
                    {t("totalCoverage", {
                      amount: money.currency(gap.totalSumInsured),
                    })}
                  </>
                ) : (
                  t("missing")
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
