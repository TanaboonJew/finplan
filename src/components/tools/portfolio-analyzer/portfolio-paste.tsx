"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/finance/format";
import { parseHoldingsCsv } from "@/lib/finance/portfolio";
import { usePortfolioStore } from "@/lib/storage/portfolio-store";

const LOCALE_TAGS: Record<string, string> = {
  en: "en-US",
  th: "th-TH",
};

export function useMoney() {
  const locale = useLocale();
  return useMemo(
    () => (amount: number) =>
      formatCurrency(amount, {
        locale: LOCALE_TAGS[locale] ?? "en-US",
        currency: locale === "th" ? "THB" : "USD",
      }),
    [locale]
  );
}

export const FIELD_INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors " +
  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring tabular-nums";

export function PastePanel() {
  const t = useTranslations("portfolio-analyzer.paste");
  const [csv, setCsv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);

  function handleParse() {
    setError(null);
    setAddedCount(null);
    try {
      const parsed = parseHoldingsCsv(csv);
      if (parsed.length === 0) {
        setError(t("noRows"));
        return;
      }
      usePortfolioStore.getState().setHoldings([
        ...usePortfolioStore.getState().holdings,
        ...parsed,
      ]);
      setAddedCount(parsed.length);
      setCsv("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("invalid"));
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{t("description")}</p>
      <textarea
        value={csv}
        onChange={(e) => {
          setCsv(e.target.value);
          setError(null);
          setAddedCount(null);
        }}
        rows={5}
        placeholder={"symbol,quantity,price\nVTI,10.5,268.40\nBND,20,72.10"}
        className="mt-3 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t("title")}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          onClick={handleParse}
          disabled={csv.trim().length === 0}
        >
          {t("parseButton")}
        </button>
        {error && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {addedCount !== null && (
          <p role="status" className="text-xs text-emerald-600 dark:text-emerald-400">
            {t("parsedOk", { count: addedCount })}
          </p>
        )}
      </div>
    </div>
  );
}
