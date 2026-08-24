"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarRange,
  ClipboardCheck,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import {
  aggregateSummaries,
  buildHealthCells,
  computeBudgetHealth,
  foldEntriesToMonths,
  summarizeCategory,
  type CategorySummary,
} from "@/lib/finance/budget";
import { MONTHS_PER_YEAR } from "@/lib/finance/constants";
import { useBudgetStore } from "@/lib/storage/budget-store";
import { AddCategoryCard } from "./add-category-card";
import { BudgetGrid } from "./budget-grid";
import { BudgetToolbar } from "./budget-toolbar";
import { localeTagOf, useMoney } from "./budget-locale";
import { PlanVsActualChart } from "./plan-vs-actual-chart";
import { RecordSpendingCard } from "./record-spending-card";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function BudgetTool() {
  const t = useTranslations("budget");
  const money = useMoney();
  const locale = useLocale();
  const localeTag = localeTagOf(locale);
  const mounted = useMounted();

  const year = useBudgetStore((state) => state.year);
  const categories = useBudgetStore((state) => state.categories);
  const entries = useBudgetStore((state) => state.entries);

  const summariesById = useMemo(() => {
    const actuals = foldEntriesToMonths(entries);
    const map = new Map<string, CategorySummary>();
    for (const category of categories) {
      map.set(
        category.id,
        summarizeCategory(
          category,
          actuals.get(category.id) ?? Array.from({ length: MONTHS_PER_YEAR }, () => 0)
        )
      );
    }
    return map;
  }, [categories, entries]);

  const summaries = useMemo(
    () => categories.map((category) => summariesById.get(category.id)!),
    [categories, summariesById]
  );

  const aggregate = useMemo(() => aggregateSummaries(summaries), [summaries]);
  const health = useMemo(
    () => computeBudgetHealth(buildHealthCells(summaries)),
    [summaries]
  );

  const totalPlanned = aggregate.planned.reduce((a, b) => a + b, 0);
  const totalActual = aggregate.actual.reduce((a, b) => a + b, 0);
  const remaining = totalPlanned - totalActual;

  const resolveName = useCallback(
    (categoryId: string) =>
      categories.find((category) => category.id === categoryId)?.name ??
      t("grid.nameColumn"),
    [categories, t]
  );

  if (!mounted) {
    return (
      <div
        className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10"
        aria-busy="true"
      >
        <span className="sr-only">{t("loading")}</span>
        <div className="flex animate-pulse flex-col gap-6">
          <div className="h-9 w-64 rounded-md bg-muted" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
          </div>
          <div className="h-72 rounded-lg bg-muted" />
          <div className="h-56 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  const healthTone =
    health.score === null
      ? ("default" as const)
      : health.grade === "great" || health.grade === "good"
        ? ("positive" as const)
        : health.grade === "poor"
          ? ("negative" as const)
          : ("default" as const);

  const healthSublabel =
    health.score === null
      ? t("stats.noData")
      : `${t(`health.${health.grade}`)} · ${t("stats.healthSublabel", {
          within: health.cellsEvaluated - health.cellsOverspent,
          total: health.cellsEvaluated,
        })}`;

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
        <BudgetToolbar slice={{ year }} />
      </header>

      <section
        aria-label={t("stats.plannedLabel")}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label={t("stats.plannedLabel")}
          value={money.currency(totalPlanned)}
          icon={<CalendarRange className="size-4" />}
          sublabel={`${year}`}
        />
        <StatCard
          label={t("stats.actualLabel")}
          value={money.currency(totalActual)}
          icon={<Wallet className="size-4" />}
        />
        <StatCard
          label={t("stats.remainingLabel")}
          value={money.currency(remaining)}
          tone={remaining >= 0 ? "positive" : "negative"}
          icon={<PiggyBank className="size-4" />}
        />
        <StatCard
          label={t("stats.healthLabel")}
          value={health.score === null ? "—" : String(health.score)}
          tone={healthTone}
          icon={<ClipboardCheck className="size-4" />}
          sublabel={healthSublabel}
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{t("grid.title")}</h3>
          <ul className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-sm border border-muted-foreground/60"
              />
              {t("grid.legendPlan")}
            </li>
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-full bg-emerald-500"
              />
              {t("grid.legendActual")}
            </li>
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-full bg-red-500"
              />
              {t("grid.legendOver")}
            </li>
          </ul>
        </header>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm font-medium">{t("grid.emptyTitle")}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("grid.emptyMessage")}
            </p>
          </div>
        ) : (
          <>
            <BudgetGrid
              categories={categories}
              summaries={summariesById}
              localeTag={localeTag}
              onSetPlan={(categoryId, month, amount) =>
                useBudgetStore.getState().setPlan(categoryId, month, amount)
              }
              onToggleRollover={(categoryId, enabled) =>
                useBudgetStore
                  .getState()
                  .updateCategory(categoryId, { rolloverEnabled: enabled })
              }
              onRemoveCategory={(categoryId, name) => {
                if (
                  window.confirm(t("grid.removeCategoryConfirm", { name }))
                ) {
                  useBudgetStore.getState().removeCategory(categoryId);
                }
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {t("grid.rolloverHint")}
            </p>
          </>
        )}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold">
            {t("grid.addCategory.addButton")}
          </h3>
          <div className="mt-3">
            <AddCategoryCard
              onAdd={(name, kind) =>
                useBudgetStore.getState().addCategory(name, kind)
              }
            />
          </div>
        </section>
        <RecordSpendingCard
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
          }))}
          entries={entries}
          localeTag={localeTag}
          resolveName={resolveName}
          onRecord={(entry) => useBudgetStore.getState().addEntry(entry)}
          onRemoveEntry={(id) => useBudgetStore.getState().removeEntry(id)}
        />
      </div>

      <PlanVsActualChart aggregate={aggregate} />
    </div>
  );
}
