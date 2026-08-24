"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatPercent } from "@/lib/finance/format";
import type {
  ProjectionResult,
  ScenarioKey,
} from "@/components/tools/retirement/projection";
import { SCENARIO_KEYS } from "@/components/tools/retirement/projection";
import {
  formatMoney,
  localeTagOf,
} from "@/components/tools/retirement/retirement-format";

export interface ScenariosTableProps {
  result: ProjectionResult;
  currency: string;
}

export function ScenariosTable({ result, currency }: ScenariosTableProps) {
  const t = useTranslations("retirement.scenarios");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);
  const money = (amount: number) => formatMoney(amount, localeTag, currency);

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("description")}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th scope="col" className="px-4 py-2 font-medium">
                {t("colScenario")}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t("colReturn")}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t("colInflation")}
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right font-medium"
              >
                {t("colBalance")}
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right font-medium"
              >
                {t("colToday")}
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right font-medium"
              >
                {t("colVsFire")}
              </th>
            </tr>
          </thead>
          <tbody>
            {SCENARIO_KEYS.map((scenario: ScenarioKey) => {
              const outcome = result.scenarios[scenario];
              const onTrack = outcome.gap >= 0;
              return (
                <tr
                  key={scenario}
                  className="border-t border-border tabular-nums"
                >
                  <td className="px-4 py-2.5">{t(scenario)}</td>
                  <td className="px-4 py-2.5">
                    {formatPercent(outcome.assumptions.annualReturnRate, {
                      locale: localeTag,
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    {formatPercent(outcome.assumptions.inflationRate, {
                      locale: localeTag,
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {money(outcome.balanceAtRetirement)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {money(outcome.realBalanceAtRetirement)}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right ${
                      onTrack
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {onTrack ? "+" : "\u2212"}
                    {money(Math.abs(outcome.gap))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
