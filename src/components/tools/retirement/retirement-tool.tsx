"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";
import {
  RETIREMENT_SCHEMA_VERSION,
  RETIREMENT_TOOL_ID,
  sanitizeRetirementSnapshot,
  useRetirementStore,
  type RetirementSnapshot,
} from "@/lib/storage/retirement-store";
import { createRetirementDemoSnapshot } from "@/lib/demo/retirement";
import { RetirementToolbar } from "@/components/tools/retirement/retirement-toolbar";
import { InputsCard } from "@/components/tools/retirement/inputs-card";
import { RetirementStats } from "@/components/tools/retirement/retirement-stats";
import { ProjectionChart } from "@/components/tools/retirement/projection-chart";
import { ScenariosTable } from "@/components/tools/retirement/scenarios-table";
import { computeProjection } from "@/components/tools/retirement/projection";
import { localeTagOf } from "@/components/tools/retirement/retirement-format";
import { useMounted } from "@/components/tools/retirement/use-mounted";

export function RetirementTool() {
  const t = useTranslations("retirement");
  const tTool = useTranslations("tools.retirement");
  const tShared = useTranslations("shared");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  const mounted = useMounted();

  const currentAge = useRetirementStore((state) => state.currentAge);
  const retirementAge = useRetirementStore((state) => state.retirementAge);
  const currentSavings = useRetirementStore((state) => state.currentSavings);
  const monthlyContribution = useRetirementStore(
    (state) => state.monthlyContribution
  );
  const annualReturnRate = useRetirementStore(
    (state) => state.annualReturnRate
  );
  const inflationRate = useRetirementStore((state) => state.inflationRate);
  const desiredRetirementIncome = useRetirementStore(
    (state) => state.desiredRetirementIncome
  );
  const withdrawalRate = useRetirementStore((state) => state.withdrawalRate);
  const currency = useRetirementStore((state) => state.currency);

  const setCurrentAge = useRetirementStore((state) => state.setCurrentAge);
  const setRetirementAge = useRetirementStore(
    (state) => state.setRetirementAge
  );
  const setCurrentSavings = useRetirementStore(
    (state) => state.setCurrentSavings
  );
  const setMonthlyContribution = useRetirementStore(
    (state) => state.setMonthlyContribution
  );
  const setAnnualReturnRate = useRetirementStore(
    (state) => state.setAnnualReturnRate
  );
  const setInflationRate = useRetirementStore(
    (state) => state.setInflationRate
  );
  const setDesiredRetirementIncome = useRetirementStore(
    (state) => state.setDesiredRetirementIncome
  );
  const setWithdrawalRate = useRetirementStore(
    (state) => state.setWithdrawalRate
  );
  const setCurrency = useRetirementStore((state) => state.setCurrency);
  const replaceState = useRetirementStore((state) => state.replaceState);
  const reset = useRetirementStore((state) => state.reset);

  const profile: RetirementSnapshot = {
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    annualReturnRate,
    inflationRate,
    desiredRetirementIncome,
    withdrawalRate,
    currency,
  };

  const result = useMemo(
    () =>
      mounted
        ? computeProjection({
            currentAge,
            retirementAge,
            currentSavings,
            monthlyContribution,
            annualReturnRate,
            inflationRate,
            desiredRetirementIncome,
            withdrawalRate,
            currency,
          })
        : null,
    [
      mounted,
      currentAge,
      retirementAge,
      currentSavings,
      monthlyContribution,
      annualReturnRate,
      inflationRate,
      desiredRetirementIncome,
      withdrawalRate,
      currency,
    ]
  );

  function handlePatch(patch: Partial<RetirementSnapshot>) {
    if (patch.currentAge !== undefined) setCurrentAge(patch.currentAge);
    if (patch.retirementAge !== undefined)
      setRetirementAge(patch.retirementAge);
    if (patch.currentSavings !== undefined)
      setCurrentSavings(patch.currentSavings);
    if (patch.monthlyContribution !== undefined)
      setMonthlyContribution(patch.monthlyContribution);
    if (patch.annualReturnRate !== undefined)
      setAnnualReturnRate(patch.annualReturnRate);
    if (patch.inflationRate !== undefined)
      setInflationRate(patch.inflationRate);
    if (patch.desiredRetirementIncome !== undefined)
      setDesiredRetirementIncome(patch.desiredRetirementIncome);
    if (patch.withdrawalRate !== undefined)
      setWithdrawalRate(patch.withdrawalRate);
  }

  function handleExport() {
    downloadJson(
      `finplan-${RETIREMENT_TOOL_ID}-${new Date().toISOString().slice(0, 10)}.json`,
      createExportEnvelope(
        RETIREMENT_TOOL_ID,
        RETIREMENT_SCHEMA_VERSION,
        profile
      )
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, RETIREMENT_TOOL_ID);
    if (envelope.schemaVersion !== RETIREMENT_SCHEMA_VERSION) {
      throw new Error(t("error.importVersion"));
    }
    const snapshot = sanitizeRetirementSnapshot(envelope.data);
    if (snapshot === null) {
      throw new Error(tShared("importError"));
    }
    replaceState(snapshot);
  }

  if (!mounted || result === null) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8" aria-busy="true">
        <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{tTool("title")}</h1>
        <p className="mt-1 text-muted-foreground">{tTool("description")}</p>
      </header>

      <RetirementToolbar
        currency={currency}
        onCurrencyChange={setCurrency}
        onSeed={() => replaceState(createRetirementDemoSnapshot())}
        onReset={reset}
        onExport={handleExport}
        onImport={handleImport}
      />

      <InputsCard profile={profile} onChange={handlePatch} />

      <RetirementStats
        result={result}
        currency={currency}
        localeTag={localeTag}
        retirementAge={retirementAge}
        monthlyContribution={monthlyContribution}
        withdrawalRate={withdrawalRate}
      />

      <ProjectionChart result={result} currency={currency} />

      <ScenariosTable result={result} currency={currency} />
    </div>
  );
}
