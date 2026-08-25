"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Tags,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/finance/format";
import { monthlyNet } from "@/lib/finance/statement";
import { useStatementStore } from "@/lib/storage/statement-store";
import { useMounted } from "./use-mounted";
import { ApplyRulesButton, StatementToolbar } from "./statement-toolbar";
import { PastePanel, RulesPanel } from "./statement-panels";
import { CategorySummary, TransactionsTable } from "./transactions-table";

const LOCALE_TAGS: Record<string, string> = {
  en: "en-US",
  th: "th-TH",
};

export function StatementTool() {
  const t = useTranslations("statement");
  const locale = useLocale();
  const mounted = useMounted();

  const transactions = useStatementStore((state) => state.transactions);

  const formatMoney = useMemo(
    () => (value: number) =>
      formatCurrency(value, {
        locale: LOCALE_TAGS[locale] ?? "en-US",
        currency: locale === "th" ? "THB" : "USD",
      }),
    [locale]
  );

  const moneyIn = useMemo(
    () =>
      transactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const moneyOut = useMemo(
    () =>
      transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const months = useMemo(() => monthlyNet(transactions), [transactions]);

  if (!mounted) {
    return (
      <div
        className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10"
        aria-busy="true"
      >
        <span className="sr-only">{t("loading")}</span>
        <div className="flex animate-pulse flex-col gap-6">
          <div className="h-9 w-64 rounded-md bg-muted" />
          <div className="h-40 rounded-lg bg-muted" />
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
          </div>
          <div className="h-64 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <StatementToolbar />
      </header>

      <PastePanel />

      {transactions.length > 0 && (
        <>
          <section
            aria-label={t("stats.label")}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatCard
              label={t("stats.moneyIn")}
              value={formatMoney(moneyIn)}
              tone="positive"
              icon={<ArrowDownLeft className="size-4" />}
            />
            <StatCard
              label={t("stats.moneyOut")}
              value={formatMoney(moneyOut)}
              tone="negative"
              icon={<ArrowUpRight className="size-4" />}
            />
            <StatCard
              label={t("stats.net")}
              value={formatMoney(moneyIn + moneyOut)}
              sublabel={
                months.length > 0 ? `${months.length} ${t("stats.months")}` : undefined
              }
              icon={<Scale className="size-4" />}
            />
            <StatCard
              label={t("stats.count")}
              value={`${transactions.length}`}
              icon={<Tags className="size-4" />}
            />
          </section>

          <CategorySummary
            transactions={transactions}
            formatMoney={formatMoney}
          />

          <div className="flex items-center justify-between">
            <ApplyRulesButton />
          </div>

          <TransactionsTable
            transactions={transactions}
            formatMoney={formatMoney}
          />

          <RulesPanel />
        </>
      )}
    </div>
  );
}
