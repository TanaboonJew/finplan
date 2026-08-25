"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { parseStatementCsv } from "@/lib/finance/statement";
import {
  useStatementStore,
} from "@/lib/storage/statement-store";

const NUM_INPUT =
  "h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const SUGGESTED_CATEGORIES = [
  "groceries",
  "dining",
  "transport",
  "shopping",
  "bills",
  "health",
  "entertainment",
  "income",
  "transfer",
  "uncategorized",
] as const;

export function PastePanel() {
  const t = useTranslations("statement.paste");
  const [csv, setCsv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);

  function handleParse() {
    setError(null);
    setAddedCount(null);
    try {
      const parsed = parseStatementCsv(csv);
      useStatementStore.getState().setTransactions([
        ...useStatementStore.getState().transactions,
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
        placeholder={"Date,Description,Amount\n2026-08-01,Salary,45000.00\n2026-08-02,Coffee shop,-120.00"}
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
          <p
            role="status"
            className="text-xs text-emerald-600 dark:text-emerald-400"
          >
            {t("parsedOk", { count: addedCount })}
          </p>
        )}
      </div>
    </div>
  );
}

export function RulesPanel() {
  const t = useTranslations("statement.rules");
  const rules = useStatementStore((state) => state.rules);
  const [pattern, setPattern] = useState("");
  const [category, setCategory] = useState("");

  const valid = pattern.trim().length > 0 && category.trim().length > 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t("description")}
      </p>

      {rules.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1.5">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">
                “{rule.pattern}”
              </span>
              <span aria-hidden>→</span>
              <select
                aria-label={`${t("categoryLabel")} — ${rule.pattern}`}
                value={
                  SUGGESTED_CATEGORIES.includes(
                    rule.category as (typeof SUGGESTED_CATEGORIES)[number]
                  )
                    ? rule.category
                    : "__custom"
                }
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === "__custom") return;
                  useStatementStore
                    .getState()
                    .updateRule(rule.id, { category: next });
                }}
                className={NUM_INPUT}
              >
                {!SUGGESTED_CATEGORIES.includes(
                  rule.category as (typeof SUGGESTED_CATEGORIES)[number]
                ) && <option value="__custom">{rule.category}</option>}
                {SUGGESTED_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`categories.${c}`)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={`${t("removeRule")} ${rule.pattern}`}
                onClick={() =>
                  useStatementStore.getState().removeRule(rule.id)
                }
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          useStatementStore.getState().addRule(pattern, category);
          setPattern("");
          setCategory("");
        }}
      >
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder={t("patternPlaceholder")}
          aria-label={t("patternPlaceholder")}
          className={`${NUM_INPUT} min-w-[140px] flex-1`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label={t("categoryLabel")}
          className={`${NUM_INPUT} w-36`}
        >
          <option value="">{t("categoryPlaceholder")}</option>
          {SUGGESTED_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`categories.${c}`)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!valid}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="size-3.5" aria-hidden />
          {t("addRule")}
        </button>
      </form>
    </div>
  );
}

export function useCategoryLabeler() {
  const t = useTranslations("statement.rules.categories");
  return useMemo(
    () =>
      (category: string): string =>
        SUGGESTED_CATEGORIES.includes(
          category as (typeof SUGGESTED_CATEGORIES)[number]
        )
          ? t(`categories.${category}` as "categories.groceries")
          : category,
    [t]
  );
}
