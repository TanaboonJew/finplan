"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Trash2 } from "lucide-react";
import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import type {
  JarActivity,
  JarTransferEntry,
} from "@/lib/finance/jars";
import type { Jar } from "@/lib/storage/jar-store";
import {
  FIELD_INPUT_CLASS,
  FIELD_LABEL_CLASS,
  todayIsoDate,
  useMoney,
} from "./controls";

interface TransfersCardProps {
  jars: Jar[];
  activity: Map<string, JarActivity>;
  transfers: JarTransferEntry[];
  resolveName: (jarId: string) => string;
  onTransfer: (entry: {
    fromJarId: string;
    toJarId: string;
    amount: number;
    date: string;
    note: string;
  }) => void;
  onRemove: (id: string) => void;
}

export function TransfersCard({
  jars,
  activity,
  transfers,
  resolveName,
  onTransfer,
  onRemove,
}: TransfersCardProps) {
  const t = useTranslations("jar.transfers");
  const money = useMoney();

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayIsoDate());

  const effectiveFrom = fromId || jars[0]?.id || "";
  const effectiveTo =
    toId && toId !== effectiveFrom
      ? toId
      : (jars.find((jar) => jar.id !== effectiveFrom)?.id ?? "");
  const needsTwoJars = jars.length < 2;
  const sameJar = effectiveFrom === effectiveTo;
  const sourceBalance = activity.get(effectiveFrom)?.balance ?? 0;
  const insufficient =
    amount !== null && amount > sourceBalance + 1e-9;
  const canSubmit =
    !needsTwoJars &&
    !sameJar &&
    amount !== null &&
    amount > 0 &&
    !insufficient;

  function handleSubmit() {
    if (!canSubmit) return;
    onTransfer({
      fromJarId: effectiveFrom,
      toJarId: effectiveTo,
      amount,
      date,
      note,
    });
    setAmount(null);
    setNote("");
    setDate(todayIsoDate());
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <ArrowLeftRight className="size-4 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold">{t("title")}</h2>
      </header>

      {needsTwoJars ? (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {t("needTwoJars")}
        </p>
      ) : (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transfer-from" className={FIELD_LABEL_CLASS}>
                {t("fromLabel")}
              </label>
              <select
                id="transfer-from"
                className={FIELD_INPUT_CLASS}
                value={effectiveFrom}
                onChange={(event) => setFromId(event.target.value)}
              >
                {jars.map((jar) => (
                  <option key={jar.id} value={jar.id}>
                    {resolveName(jar.id)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transfer-to" className={FIELD_LABEL_CLASS}>
                {t("toLabel")}
              </label>
              <select
                id="transfer-to"
                className={FIELD_INPUT_CLASS}
                value={effectiveTo}
                onChange={(event) => setToId(event.target.value)}
              >
                {jars.map((jar) => (
                  <option key={jar.id} value={jar.id}>
                    {resolveName(jar.id)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_9rem]">
            <MoneyInput
              label={t("amountLabel")}
              value={amount}
              onChange={setAmount}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transfer-note" className={FIELD_LABEL_CLASS}>
                {t("noteLabel")}
              </label>
              <input
                id="transfer-note"
                type="text"
                className={FIELD_INPUT_CLASS}
                value={note}
                maxLength={80}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transfer-date" className={FIELD_LABEL_CLASS}>
                {t("dateLabel")}
              </label>
              <input
                id="transfer-date"
                type="date"
                className={FIELD_INPUT_CLASS}
                value={date}
                max="9999-12-31"
                onChange={(event) =>
                  setDate(event.target.value || todayIsoDate())
                }
              />
            </div>
          </div>

          <p aria-live="polite" className="text-xs text-muted-foreground">
            {sameJar
              ? t("sameJarHint")
              : insufficient
                ? t("insufficientHint")
                : `${t("availableLabel")}: ${money.currency(sourceBalance)}`}
          </p>

          <div>
            <Button type="submit" size="sm" disabled={!canSubmit}>
              {t("move")}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("logTitle")}
        </h3>
        {transfers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("logEmpty")}</p>
        ) : (
          <ul className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
            {transfers.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-1.5 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium tabular-nums">
                    {money.currency(entry.amount)}
                    <span className="mx-1 text-muted-foreground">·</span>
                    {resolveName(entry.fromJarId)}
                    <span className="mx-1 text-muted-foreground">→</span>
                    {resolveName(entry.toJarId)}
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
