"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Coins, Trash2 } from "lucide-react";
import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import type { JarIncomeEntry } from "@/lib/finance/jars";
import type { Jar } from "@/lib/storage/jar-store";
import {
  FIELD_INPUT_CLASS,
  FIELD_LABEL_CLASS,
  todayIsoDate,
  useMoney,
} from "./controls";

interface IncomeCardProps {
  jars: Jar[];
  incomes: JarIncomeEntry[];
  splitTotal: number;
  resolveName: (jarId: string) => string;
  onDistribute: (entry: { amount: number; date: string; note: string }) => void;
  onRemove: (id: string) => void;
}

export function IncomeCard({
  jars,
  incomes,
  splitTotal,
  resolveName,
  onDistribute,
  onRemove,
}: IncomeCardProps) {
  const t = useTranslations("jar.income");
  const money = useMoney();

  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayIsoDate());

  const hasPositiveSplit = splitTotal > 0;
  const canSubmit = amount !== null && amount > 0 && hasPositiveSplit;

  function handleSubmit() {
    if (!canSubmit || amount === null) return;
    onDistribute({ amount, date, note });
    setAmount(null);
    setNote("");
    setDate(todayIsoDate());
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <Coins className="size-4 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold">{t("title")}</h2>
      </header>

      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_9rem]">
          <MoneyInput
            label={t("amountLabel")}
            value={amount}
            onChange={setAmount}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="income-note" className={FIELD_LABEL_CLASS}>
              {t("noteLabel")}
            </label>
            <input
              id="income-note"
              type="text"
              className={FIELD_INPUT_CLASS}
              value={note}
              maxLength={80}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="income-date" className={FIELD_LABEL_CLASS}>
              {t("dateLabel")}
            </label>
            <input
              id="income-date"
              type="date"
              className={FIELD_INPUT_CLASS}
              value={date}
              max="9999-12-31"
              onChange={(event) => setDate(event.target.value || todayIsoDate())}
            />
          </div>
        </div>

        <p aria-live="polite" className="text-xs text-muted-foreground">
          {!hasPositiveSplit
            ? t("noSplitHint")
            : `${t("splitHintPrefix")} ${jars
                .filter((jar) => jar.allocationPercent > 0)
                .map(
                  (jar) =>
                    `${resolveName(jar.id)} ${money.percent(jar.allocationPercent / splitTotal)}`
                )
                .join(" · ")}`}
        </p>

        <div>
          <Button type="submit" disabled={!canSubmit}>
            {t("distribute")}
          </Button>
        </div>
      </form>

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("logTitle")}
        </h3>
        {incomes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("logEmpty")}</p>
        ) : (
          <ul className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
            {incomes.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-1.5 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium tabular-nums">
                    {money.currency(entry.amount)}
                    <span className="mx-1 text-muted-foreground">·</span>
                    {entry.allocations
                      .map(
                        (allocation) =>
                          `${resolveName(allocation.jarId)} ${money.currency(allocation.amount)}`
                      )
                      .join(" · ")}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground tabular-nums">
                    {entry.date}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(entry.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                  <span className="sr-only">{t("remove")}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
