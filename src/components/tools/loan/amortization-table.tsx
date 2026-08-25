"use client";

import { useLocale, useTranslations } from "next-intl";
import { TableProperties } from "lucide-react";
import type { AmortizationRow } from "@/lib/finance/amortization";
import {
  formatMoney,
  formatMonthYear,
  addMonthsToMonth,
  localeTagOf,
} from "@/components/tools/loan/loan-format";

export interface AmortizationTableProps {
  schedule: readonly AmortizationRow[];
  startMonth: string | null;
  currency: string;
}

export function AmortizationTable({
  schedule,
  startMonth,
  currency,
}: AmortizationTableProps) {
  const t = useTranslations("loan.table");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <TableProperties
          className="size-4 text-muted-foreground"
          aria-hidden
        />
        <div>
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          {startMonth ? (
            <p className="text-xs text-muted-foreground">
              {t("subtitle", { date: formatMonthYear(startMonth, localeTag) })}
            </p>
          ) : null}
        </div>
      </header>

      <div className="max-h-[420px] overflow-auto rounded-md border border-border">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0] shadow-border">
            <tr className="text-xs text-muted-foreground">
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {t("colMonth")}
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {t("colPayment")}
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {t("colPrincipal")}
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {t("colInterest")}
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium">
                {t("colBalance")}
              </th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => (
              <tr
                key={row.month}
                className="border-t border-border tabular-nums"
              >
                <td className="px-3 py-1.5 text-end text-muted-foreground">
                  {startMonth
                    ? formatMonthYear(
                        addMonthsToMonth(startMonth, row.month - 1),
                        localeTag
                      )
                    : row.month}
                </td>
                <td className="px-3 py-1.5 text-end font-medium">
                  {formatMoney(row.payment, localeTag, currency)}
                </td>
                <td className="px-3 py-1.5 text-end text-muted-foreground">
                  {formatMoney(row.principal, localeTag, currency)}
                </td>
                <td className="px-3 py-1.5 text-end text-muted-foreground">
                  {formatMoney(row.interest, localeTag, currency)}
                </td>
                <td className="px-3 py-1.5 text-end">
                  {formatMoney(row.balance, localeTag, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
