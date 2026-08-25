"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";
import {
  TIMELINE_SCHEMA_VERSION,
  TIMELINE_TOOL_ID,
  sanitizeTimelineSnapshot,
  useTimelineStore,
  type TimelineSnapshot,
} from "@/lib/storage/timeline-store";
import { createTimelineDemoSnapshot } from "@/lib/demo/timeline";
import { TimelineToolbar } from "@/components/tools/timeline/timeline-toolbar";
import { ProfileCard } from "@/components/tools/timeline/profile-card";
import { GoalsList } from "@/components/tools/timeline/goals-list";
import { TimelineStats } from "@/components/tools/timeline/timeline-stats";
import { ConflictAlerts } from "@/components/tools/timeline/conflict-alerts";
import { GanttChart } from "@/components/tools/timeline/gantt-chart";
import { CashFlowChart } from "@/components/tools/timeline/cashflow-chart";
import { useMounted } from "@/components/tools/timeline/use-mounted";

export function TimelineTool() {
  const t = useTranslations("timeline");
  const tTool = useTranslations("tools.timeline");
  const tShared = useTranslations("shared");

  const mounted = useMounted();

  const currentAge = useTimelineStore((state) => state.currentAge);
  const monthlyBudget = useTimelineStore((state) => state.monthlyBudget);
  const annualReturnRate = useTimelineStore((state) => state.annualReturnRate);
  const inflationRate = useTimelineStore((state) => state.inflationRate);
  const goals = useTimelineStore((state) => state.goals);
  const currency = useTimelineStore((state) => state.currency);

  const setCurrentAge = useTimelineStore((state) => state.setCurrentAge);
  const setMonthlyBudget = useTimelineStore((state) => state.setMonthlyBudget);
  const setAnnualReturnRate = useTimelineStore(
    (state) => state.setAnnualReturnRate
  );
  const setInflationRate = useTimelineStore((state) => state.setInflationRate);
  const setCurrency = useTimelineStore((state) => state.setCurrency);
  const addGoal = useTimelineStore((state) => state.addGoal);
  const updateGoal = useTimelineStore((state) => state.updateGoal);
  const removeGoal = useTimelineStore((state) => state.removeGoal);
  const replaceState = useTimelineStore((state) => state.replaceState);
  const reset = useTimelineStore((state) => state.reset);

  const profile: TimelineSnapshot = useMemo(
    () => ({
      currentAge,
      monthlyBudget,
      annualReturnRate,
      inflationRate,
      goals,
      currency,
    }),
    [currentAge, monthlyBudget, annualReturnRate, inflationRate, goals, currency]
  );

  function handleExport() {
    downloadJson(
      `finplan-${TIMELINE_TOOL_ID}-${new Date().toISOString().slice(0, 10)}.json`,
      createExportEnvelope(
        TIMELINE_TOOL_ID,
        TIMELINE_SCHEMA_VERSION,
        profile
      )
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, TIMELINE_TOOL_ID);
    if (envelope.schemaVersion !== TIMELINE_SCHEMA_VERSION) {
      throw new Error(t("error.importVersion"));
    }
    const snapshot = sanitizeTimelineSnapshot(envelope.data);
    if (snapshot === null) {
      throw new Error(tShared("importError"));
    }
    replaceState(snapshot);
  }

  if (!mounted) {
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
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <TimelineToolbar
        currency={currency}
        onCurrencyChange={setCurrency}
        onSeed={() => replaceState(createTimelineDemoSnapshot())}
        onReset={reset}
        onExport={handleExport}
        onImport={handleImport}
      />

      <ProfileCard
        currentAge={currentAge}
        monthlyBudget={monthlyBudget}
        annualReturnRate={annualReturnRate}
        inflationRate={inflationRate}
        currency={currency}
        onCurrentAgeChange={setCurrentAge}
        onMonthlyBudgetChange={setMonthlyBudget}
        onAnnualReturnRateChange={setAnnualReturnRate}
        onInflationRateChange={setInflationRate}
      />

      <TimelineStats
        goals={goals}
        monthlyBudget={monthlyBudget}
        currentAge={currentAge}
        currency={currency}
      />

      <GoalsList
        goals={goals}
        currentAge={currentAge}
        currency={currency}
        defaultReturnRate={annualReturnRate}
        defaultInflationRate={inflationRate}
        onAdd={addGoal}
        onUpdate={updateGoal}
        onRemove={removeGoal}
      />

      <ConflictAlerts
        goals={goals}
        monthlyBudget={monthlyBudget}
        currency={currency}
      />

      <GanttChart goals={goals} />

      <CashFlowChart
        goals={goals}
        monthlyBudget={monthlyBudget}
        currentAge={currentAge}
        currency={currency}
      />
    </div>
  );
}
