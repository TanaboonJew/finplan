"use client";

import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TableProperties } from "lucide-react";
import type {
  PayoffResult,
  PayoffStrategy,
} from "@/lib/finance/payoff";
import type { DebtInput } from "@/lib/storage/debt-store";
import {
  addMonthsToMonth,
  formatMoney,
  formatMonthYear,
  localeTagOf,
} from "@/components/tools/debt/debt-format";

export interface PayoffTableProps {
  result: PayoffResult;
  strategy: PayoffStrategy;
  debts: readonly DebtInput[];
  startMonth: string;
  currency: string;
}

function clearedNamesByMonth(
  result: PayoffResult,
  debts: readonly DebtInput[]
): Map<number, string[]> {
  const nameById = new Map(debts.map((debt) => [debt.id, debt.name]));
  const byMonth = new Map<number, string[]>();
  for (const id of result.payoffOrder) {
    const month = result.payoffMonthById[id];
    if (month === undefined) continue;
    const name = nameById.get(id) ?? id;
    const existing = byMonth.get(month);
    if (existing) {
      existing.push(name);
    } else {
      byMonth.set(month, [name]);
    }
  }
  return byMonth;
}

export function PayoffTable({
  result,
  strategy,
  debts,
  startMonth,
  currency,
}: PayoffTableProps) {
  const t = useTranslations("debt.table");
  const ts = useTranslations("debt.strategies");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);
  const cleared = clearedNamesByMonth(result, debts);
  const startDate = formatMonthYear(startMonth, localeTag);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <TableProperties
          className="size-4 text-muted-foreground"
          aria-hidden
        />
        <div>
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("subtitle", { strategy: ts(strategy), date: startDate })}
          </p>
        </div>
      </header>

      <div className="max-h-[420px] overflow-auto rounded-md border border-border">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0] shadow-border">
            <tr className="text-xs text-muted-foreground">
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {t("colIndex")}
              </th>
              <th scope="col" className="px-3 py-2 text-start font-medium">
                {t("colDate")}
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {t("colBalance")}
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {t("colInterest")}
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {t("colPrincipal")}
              </th>
            </tr>
          </thead>
          <tbody>
            {result.monthly.map((record) => {
              const names = cleared.get(record.month);
              return (
                <Fragment key={record.month}>
                  <tr className="border-t border-border tabular-nums">
                    <td className="px-3 py-1.5 text-end text-muted-foreground">
                      {record.month}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5">
                      {formatMonthYear(
                        addMonthsToMonth(startMonth, record.month - 1),
                        localeTag
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-end font-medium">
                      {formatMoney(record.totalBalance, localeTag, currency)}
                    </td>
                    <td className="px-3 py-1.5 text-end text-muted-foreground">
                      {formatMoney(record.interestPaid, localeTag, currency)}
                    </td>
                    <td className="px-3 py-1.5 text-end text-muted-foreground">
                      {formatMoney(record.principalPaid, localeTag, currency)}
                    </td>
                  </tr>
                  {names ? (
                    <tr className="border-t border-border bg-emerald-500/5">
                      <td
                        colSpan={5}
                        className="px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400"
                      >
                        {names.map((name) => t("clearedRow", { name })).join(" · ")}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
