"use client";

import { useTranslations } from "next-intl";
import type { MonthlyPoint } from "@/lib/finance/flow";
import { formatCurrency } from "@/lib/finance/format";
import { formatMonth } from "./flow-format";

interface FlowTableProps {
  data: MonthlyPoint[];
  currency: string;
  locale: string;
}

export function FlowTable({ data, currency, locale }: FlowTableProps) {
  const t = useTranslations("flow");

  if (data.length === 0) return null;

  function fmt(v: number) {
    return formatCurrency(v, { currency, locale });
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{t("table.title")}</h2>
      <div className="max-h-[400px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
              <th className="pb-2 pr-4">{t("table.colMonth")}</th>
              <th className="pb-2 pr-4 text-right">{t("table.colIncome")}</th>
              <th className="pb-2 pr-4 text-right">{t("table.colExpense")}</th>
              <th className="pb-2 pr-4 text-right">{t("table.colNet")}</th>
              <th className="pb-2 text-right">{t("table.colBalance")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pt) => (
              <tr
                key={pt.month}
                className="border-b border-border/50 last:border-0"
              >
                <td className="py-2 pr-4 tabular-nums">{formatMonth(pt.month)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  {fmt(pt.totalIncome)}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-red-600 dark:text-red-400">
                  {fmt(pt.totalExpense)}
                </td>
                <td
                  className={`py-2 pr-4 text-right tabular-nums font-medium ${
                    pt.netFlow >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {fmt(pt.netFlow)}
                </td>
                <td
                  className={`py-2 text-right tabular-nums font-medium ${
                    pt.balance >= 0
                      ? "text-foreground"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {fmt(pt.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
