"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, ShoppingBag, Trash2, TriangleAlert } from "lucide-react";
import { MoneyInput } from "@/components/shared/money-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JarActivity } from "@/lib/finance/jars";
import type { Jar } from "@/lib/storage/jar-store";
import { FIELD_INPUT_CLASS, useMoney } from "./controls";

interface JarsGridProps {
  jars: Jar[];
  activity: Map<string, JarActivity>;
  referencedIds: Set<string>;
  splitTotal: number;
  resolveName: (jarId: string) => string;
  onAddJar: () => void;
  onLoadClassic?: () => void;
  onUpdateJar: (
    id: string,
    patch: Partial<Pick<Jar, "name" | "allocationPercent">>
  ) => void;
  onRemoveJar: (id: string) => void;
  onSpend: (jarId: string, entry: { amount: number; date: string; note: string }) => void;
}

export function JarsGrid({
  jars,
  activity,
  referencedIds,
  splitTotal,
  resolveName,
  onAddJar,
  onLoadClassic,
  onUpdateJar,
  onRemoveJar,
  onSpend,
}: JarsGridProps) {
  const t = useTranslations("jar.jars");
  const money = useMoney();
  const splitIsValid = Math.abs(splitTotal - 1) <= 1e-9;

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">{t("title")}</h2>
          <Badge
            variant={splitIsValid ? "secondary" : "outline"}
            className={
              splitIsValid
                ? undefined
                : "border-amber-500/60 text-amber-700 dark:text-amber-400"
            }
          >
            {!splitIsValid ? <TriangleAlert aria-hidden /> : null}
            {`${t("splitTotalLabel")} ${money.percent(splitTotal)}`}
          </Badge>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddJar}>
          <Plus className="size-4" aria-hidden />
          {t("addJar")}
        </Button>
      </header>

      {jars.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("emptyMessage")}
          </p>
          {onLoadClassic ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onLoadClassic}
            >
              {t("loadClassic")}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {jars.map((jar) => (
            <JarCard
              key={jar.id}
              jar={jar}
              activity={activity.get(jar.id)}
              referenced={referencedIds.has(jar.id)}
              resolveName={resolveName}
              onUpdateJar={onUpdateJar}
              onRemoveJar={onRemoveJar}
              onSpend={onSpend}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface JarCardProps {
  jar: Jar;
  activity?: JarActivity;
  referenced: boolean;
  resolveName: (jarId: string) => string;
  onUpdateJar: JarsGridProps["onUpdateJar"];
  onRemoveJar: (id: string) => void;
  onSpend: JarsGridProps["onSpend"];
}

function JarCard({
  jar,
  activity,
  referenced,
  resolveName,
  onUpdateJar,
  onRemoveJar,
  onSpend,
}: JarCardProps) {
  const t = useTranslations("jar.jars");
  const money = useMoney();

  const [spendAmount, setSpendAmount] = useState<number | null>(null);
  const [spendNote, setSpendNote] = useState("");

  const balance = activity?.balance ?? 0;
  const inflow =
    (activity?.allocated ?? 0) + (activity?.transferredIn ?? 0);
  const spent = activity?.spent ?? 0;
  const capacity = inflow > 0 ? inflow : 1;
  const remainingShare = Math.max(0, Math.min(1, balance / capacity));
  const overspent =
    spendAmount !== null && spendAmount > balance + 1e-9;

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <label className="sr-only" htmlFor={`jar-name-${jar.id}`}>
          {t("nameLabel")}
        </label>
        <input
          id={`jar-name-${jar.id}`}
          type="text"
          className="min-w-0 flex-1 rounded-md bg-transparent text-base font-semibold outline-none focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          value={jar.name}
          maxLength={40}
          placeholder={t("nameLabel")}
          onChange={(event) => onUpdateJar(jar.id, { name: event.target.value })}
        />
        <label className="sr-only" htmlFor={`jar-percent-${jar.id}`}>
          {t("percentLabel")}
        </label>
        <span className="relative inline-flex items-center">
          <input
            id={`jar-percent-${jar.id}`}
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step={0.5}
            className={`${FIELD_INPUT_CLASS} w-20 pr-6 text-right`}
            value={Math.round(jar.allocationPercent * 100 * 100) / 100}
            onChange={(event) => {
              const raw = Number(event.target.value);
              if (!Number.isFinite(raw)) return;
              const clamped = Math.max(0, Math.min(100, raw));
              onUpdateJar(jar.id, { allocationPercent: clamped / 100 });
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-2.5 text-xs text-muted-foreground"
          >
            %
          </span>
        </span>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">{t("balanceLabel")}</p>
        <p className="text-xl font-semibold tabular-nums">
          {money.currency(balance)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {`${money.percent(jar.allocationPercent)} · ${t("spentLabel")} ${money.currency(spent)}`}
        </p>
      </div>

      <div
        role="img"
        aria-label={`${resolveName(jar.id)}: ${money.percent(remainingShare)}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${remainingShare * 100}%` }}
        />
      </div>

      <form
        className="mt-auto grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!spendAmount || spendAmount <= 0 || overspent) return;
          onSpend(jar.id, {
            amount: spendAmount,
            date: new Date().toISOString().slice(0, 10),
            note: spendNote,
          });
          setSpendAmount(null);
          setSpendNote("");
        }}
      >
        <MoneyInput
          label={<span className="sr-only">{t("spendLabel")}</span>}
          value={spendAmount}
          onChange={setSpendAmount}
          placeholder={t("spendLabel")}
        />
        <div className="flex gap-2">
          <input
            type="text"
            className={`${FIELD_INPUT_CLASS} min-w-0 flex-1`}
            value={spendNote}
            maxLength={80}
            placeholder={t("spendNotePlaceholder")}
            aria-label={t("spendNotePlaceholder")}
            onChange={(event) => setSpendNote(event.target.value)}
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={!spendAmount || spendAmount <= 0 || overspent}
            title={overspent ? t("overspendHint") : undefined}
          >
            <ShoppingBag className="size-4" aria-hidden />
            {t("spendLabel")}
          </Button>
        </div>
      </form>

      <div className="flex items-center justify-between gap-2">
        <p
          aria-live="polite"
          className={
            overspent
              ? "text-xs text-red-600 dark:text-red-400"
              : "text-xs text-transparent select-none"
          }
        >
          {overspent ? t("overspendHint") : "·"}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          disabled={referenced}
          title={referenced ? t("deleteBlockedHint") : t("removeJar")}
          onClick={() => onRemoveJar(jar.id)}
        >
          <Trash2 className="size-4" aria-hidden />
          <span className="sr-only">{t("removeJar")}</span>
        </Button>
      </div>
    </article>
  );
}
