"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { NotebookPen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/shared/money-input";
import { cn } from "@/lib/utils";
import type { BudgetEntry } from "@/lib/storage/budget-store";
import {
  FIELD_INPUT_CLASS,
  FIELD_LABEL_CLASS,
  todayIsoDate,
} from "./budget-fields";
import {
  formatMonthLong,
  formatMoney,
  useMoney,
} from "./budget-locale";

const MONTHS_PER_YEAR = 12;

export interface RecordSpendingCardProps {
  categories: Array<{ id: string; name: string }>;
  entries: BudgetEntry[];
  localeTag: string;
  resolveName: (categoryId: string) => string;
  onRecord: (entry: {
    categoryId: string;
    month: number;
    amount: number;
    date: string;
    note: string;
  }) => void;
  onRemoveEntry: (id: string) => void;
}

export function RecordSpendingCard({
  categories,
  entries,
  localeTag,
  resolveName,
  onRecord,
  onRemoveEntry,
}: RecordSpendingCardProps) {
  const t = useTranslations("budget.record");
  const money = useMoney();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [month, setMonth] = useState(new Date().getMonth());
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const effectiveCategoryId =
    categories.some((category) => category.id === categoryId)
      ? categoryId
      : (categories[0]?.id ?? "");

  const months = Array.from({ length: MONTHS_PER_YEAR }, (_, index) => index);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!effectiveCategoryId || !(amount !== null && amount > 0)) return;
    onRecord({
      categoryId: effectiveCategoryId,
      month,
      amount,
      date: todayIsoDate(),
      note,
    });
    setAmount(null);
    setNote("");
  }

  if (categories.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("needCategoryHint")}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{t("title")}</h3>

      <form className="mt-3 grid gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="budget-entry-category" className={FIELD_LABEL_CLASS}>
              {t("categoryLabel")}
            </label>
            <select
              id="budget-entry-category"
              className={FIELD_INPUT_CLASS}
              value={effectiveCategoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="budget-entry-month" className={FIELD_LABEL_CLASS}>
              {t("monthLabel")}
            </label>
            <select
              id="budget-entry-month"
              className={FIELD_INPUT_CLASS}
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {months.map((index) => (
                <option key={index} value={index}>
                  {formatMonthLong(index, localeTag)}
                </option>
              ))}
            </select>
          </div>
          <MoneyInput
            label={t("amountLabel")}
            value={amount}
            onChange={setAmount}
            hideLabel
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="budget-entry-note" className={FIELD_LABEL_CLASS}>
              {t("noteLabel")}
            </label>
            <input
              id="budget-entry-note"
              type="text"
              autoComplete="off"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("notePlaceholder")}
              className={`${FIELD_INPUT_CLASS} normal-nums`}
            />
          </div>
        </div>
        <div>
          <Button
            type="submit"
            size="sm"
            disabled={amount === null || amount <= 0}
          >
            <NotebookPen className="size-4" aria-hidden />
            {t("addButton")}
          </Button>
        </div>
      </form>

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("logTitle")}
        </h4>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("logEmpty")}</p>
        ) : (
          <ul className="mt-2 divide-y divide-border/60">
            {entries.slice(0, 8).map((entry) => (
              <li key={entry.id} className="flex items-center gap-2 py-1.5 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {resolveName(entry.categoryId)}
                  {entry.note.trim().length > 0 ? (
                    <span className="text-muted-foreground"> · {entry.note}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatMonthLong(entry.month, localeTag)}
                </span>
                <span className="w-20 shrink-0 text-right tabular-nums">
                  {formatMoney(entry.amount, localeTag)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveEntry(entry.id)}
                  className={cn(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-md",
                    "text-muted-foreground transition-colors hover:bg-muted hover:text-red-600",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "dark:hover:text-red-400"
                  )}
                  aria-label={`${t("remove")} – ${resolveName(entry.categoryId)} ${money.currency(entry.amount)}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
