"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import type { StatementTransaction } from "@/lib/finance/statement";
import { summarizeByCategory } from "@/lib/finance/statement";
import { useStatementStore } from "@/lib/storage/statement-store";
import {
  SUGGESTED_CATEGORIES,
  useCategoryLabeler,
} from "./statement-panels";

const NUM_INPUT =
  "h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CategorySummary({
  transactions,
  formatMoney,
}: {
  transactions: readonly StatementTransaction[];
  formatMoney: (value: number) => string;
}) {
  const t = useTranslations("statement.summary");
  const labelCategory = useCategoryLabeler();
  const summary = summarizeByCategory(transactions);

  if (summary.length === 0) return null;

  const maxAbs = Math.max(...summary.map((s) => Math.abs(s.total)), 1);

  return (
    <section
      aria-label={t("title")}
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {summary.map((row) => (
          <li key={row.category} className="text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                {labelCategory(row.category)}
                <span className="ml-2 text-muted-foreground">
                  ×{row.count}
                </span>
              </span>
              <span
                className={`tabular-nums ${
                  row.total >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground"
                }`}
              >
                {formatMoney(row.total)}
              </span>
            </div>
            <div
              className="mt-1 h-1.5 rounded-full bg-muted"
              role="presentation"
            >
              <div
                className={`h-full rounded-full ${
                  row.total >= 0 ? "bg-emerald-500" : "bg-red-400"
                }`}
                style={{
                  width: `${Math.max(2, (Math.abs(row.total) / maxAbs) * 100)}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TransactionsTable({
  transactions,
  formatMoney,
}: {
  transactions: readonly StatementTransaction[];
  formatMoney: (value: number) => string;
}) {
  const t = useTranslations("statement.transactions");
  const tRules = useTranslations("statement.rules.categories");

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {t("emptyTitle")}
        </p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {t("emptyMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">{t("title")}</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="px-4 py-2 font-medium">{t("date")}</th>
            <th scope="col" className="px-4 py-2 font-medium">{t("description")}</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">{t("amount")}</th>
            <th scope="col" className="px-4 py-2 font-medium">{t("category")}</th>
            <th scope="col" className="px-4 py-2 font-medium">
              <span className="sr-only">{t("remove")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr
              key={transaction.id}
              className="border-b border-border last:border-b-0"
            >
              <td className="whitespace-nowrap px-4 py-1.5 tabular-nums">
                {transaction.date}
              </td>
              <td className="max-w-[240px] truncate px-4 py-1.5" title={transaction.description}>
                {transaction.description}
              </td>
              <td
                className={`px-4 py-1.5 text-right tabular-nums ${
                  transaction.amount >= 0
                    ? "font-medium text-emerald-600 dark:text-emerald-400"
                    : "font-medium"
                }`}
              >
                {formatMoney(transaction.amount)}
              </td>
              <td className="px-4 py-1.5">
                <select
                  aria-label={`${t("category")} — ${transaction.description}`}
                  value={
                    SUGGESTED_CATEGORIES.includes(
                      transaction.category as (typeof SUGGESTED_CATEGORIES)[number]
                    )
                      ? transaction.category
                      : "__custom"
                  }
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === "__custom") return;
                    useStatementStore
                      .getState()
                      .updateCategory(transaction.id, next);
                  }}
                  className={NUM_INPUT}
                >
                  {!SUGGESTED_CATEGORIES.includes(
                    transaction.category as (typeof SUGGESTED_CATEGORIES)[number]
                  ) && (
                    <option value="__custom">{transaction.category}</option>
                  )}
                  {SUGGESTED_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {tRules(`categories.${c}` as "categories.groceries")}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-1.5">
                <button
                  type="button"
                  aria-label={`${t("remove")} ${transaction.description}`}
                  onClick={() =>
                    useStatementStore.getState().removeTransaction(transaction.id)
                  }
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
