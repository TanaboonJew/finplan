"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";
import {
  DEBT_SCHEMA_VERSION,
  DEBT_TOOL_ID,
  currentMonth,
  sanitizeDebtSnapshot,
  useDebtStore,
  type DebtSnapshot,
} from "@/lib/storage/debt-store";
import { createDebtDemoSnapshot } from "@/lib/demo/debt";
import { DebtToolbar } from "@/components/tools/debt/debt-toolbar";
import { DebtStats } from "@/components/tools/debt/debt-stats";
import { DebtEditor } from "@/components/tools/debt/debt-editor";
import {
  StrategyComparison,
} from "@/components/tools/debt/strategy-comparison";
import { PayoffChart } from "@/components/tools/debt/payoff-chart";
import {
  ExtraSimulator,
} from "@/components/tools/debt/extra-simulator";
import { PayoffTable } from "@/components/tools/debt/payoff-table";
import { compareDebtPlans } from "@/components/tools/debt/run-comparison";
import {
  addMonthsToMonth,
  localeTagOf,
} from "@/components/tools/debt/debt-format";
import { useMounted } from "@/components/tools/debt/use-mounted";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function DebtTool() {
  const t = useTranslations("debt");
  const tTool = useTranslations("tools.debt");
  const tShared = useTranslations("shared");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  const mounted = useMounted();

  const debts = useDebtStore((state) => state.debts);
  const strategy = useDebtStore((state) => state.strategy);
  const extraMonthlyPayment = useDebtStore(
    (state) => state.extraMonthlyPayment
  );
  const currency = useDebtStore((state) => state.currency);
  const storedStartMonth = useDebtStore((state) => state.startMonth);
  const addDebt = useDebtStore((state) => state.addDebt);
  const updateDebt = useDebtStore((state) => state.updateDebt);
  const removeDebt = useDebtStore((state) => state.removeDebt);
  const setStrategy = useDebtStore((state) => state.setStrategy);
  const setExtraMonthlyPayment = useDebtStore(
    (state) => state.setExtraMonthlyPayment
  );
  const setCurrency = useDebtStore((state) => state.setCurrency);
  const setStartMonth = useDebtStore((state) => state.setStartMonth);
  const replaceState = useDebtStore((state) => state.replaceState);
  const reset = useDebtStore((state) => state.reset);

  const startMonth =
    mounted && storedStartMonth !== null
      ? storedStartMonth
      : currentMonth(new Date());

  const comparison = useMemo(
    () => (mounted ? compareDebtPlans(debts, extraMonthlyPayment) : { results: {}, error: null }),
    [mounted, debts, extraMonthlyPayment]
  );
  const baseline = useMemo(
    () => (mounted ? compareDebtPlans(debts, 0) : { results: {}, error: null }),
    [mounted, debts]
  );

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8" aria-busy="true">
        <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }

  const result = comparison.results[strategy] ?? null;
  const baselineResult = baseline.results[strategy] ?? null;
  const hasResults = Object.keys(comparison.results).length > 0;
  const totalBalance = round2(
    debts.reduce((sum, debt) => sum + debt.balance, 0)
  );
  const monthlyMinimums = round2(
    debts.reduce((sum, debt) => sum + debt.minimumPayment, 0)
  );
  const debtFreeMonth =
    result === null
      ? null
      : result.monthsToPayoff === 0
        ? startMonth
        : addMonthsToMonth(startMonth, result.monthsToPayoff - 1);
  const interestSaved =
    baselineResult !== null && result !== null
      ? Math.max(0, round2(baselineResult.totalInterest - result.totalInterest))
      : 0;

  function handleExport() {
    const snapshot: DebtSnapshot = {
      debts: debts.map(({ id, name, balance, annualRate, minimumPayment }) => ({
        id,
        name,
        balance,
        annualRate,
        minimumPayment,
      })),
      strategy,
      extraMonthlyPayment,
      currency,
      startMonth: storedStartMonth,
    };
    downloadJson(
      `finplan-${DEBT_TOOL_ID}-${new Date().toISOString().slice(0, 10)}.json`,
      createExportEnvelope(DEBT_TOOL_ID, DEBT_SCHEMA_VERSION, snapshot)
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, DEBT_TOOL_ID);
    if (envelope.schemaVersion !== DEBT_SCHEMA_VERSION) {
      throw new Error(t("error.importVersion"));
    }
    const snapshot = sanitizeDebtSnapshot(envelope.data);
    if (snapshot === null) {
      throw new Error(tShared("importError"));
    }
    replaceState(snapshot);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {tTool("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{tTool("description")}</p>
      </header>

      <DebtToolbar
        currency={currency}
        startMonth={startMonth}
        onCurrencyChange={setCurrency}
        onStartMonthChange={setStartMonth}
        onSeed={() =>
          replaceState(createDebtDemoSnapshot(new Date()))
        }
        onReset={reset}
        onExport={handleExport}
        onImport={handleImport}
      />

      {comparison.error !== null ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            {comparison.error === "unsolvable"
              ? t("error.unsolvable")
              : t("error.generic")}
          </p>
        </div>
      ) : null}

      <DebtEditor
        debts={debts}
        currency={currency}
        localeTag={localeTag}
        onAdd={addDebt}
        onUpdate={updateDebt}
        onRemove={removeDebt}
      />

      {debts.length > 0 && comparison.error === null ? (
        <DebtStats
          totalBalance={totalBalance}
          debtCount={debts.length}
          monthlyMinimums={monthlyMinimums}
          extraMonthlyPayment={extraMonthlyPayment}
          currency={currency}
          debtFreeMonth={debtFreeMonth}
          interestSaved={interestSaved}
        />
      ) : null}

      {hasResults ? (
        <>
          <StrategyComparison
            results={comparison.results}
            selected={strategy}
            onSelect={setStrategy}
            startMonth={startMonth}
            currency={currency}
            localeTag={localeTag}
          />
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <PayoffChart
                results={comparison.results}
                selected={strategy}
                startMonth={startMonth}
                currency={currency}
              />
            </div>
            <ExtraSimulator
              extraMonthlyPayment={extraMonthlyPayment}
              onExtraChange={(value) =>
                setExtraMonthlyPayment(value ?? 0)
              }
              strategy={strategy}
              baselineResult={baselineResult}
              currentResult={result}
              maxExtra={Math.ceil(monthlyMinimums * 2)}
              currency={currency}
            />
          </div>
          {result !== null ? (
            <PayoffTable
              result={result}
              strategy={strategy}
              debts={debts}
              startMonth={startMonth}
              currency={currency}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
