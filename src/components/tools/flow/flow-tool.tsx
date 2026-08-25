"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";
import {
  FLOW_TOOL_ID,
  FLOW_SCHEMA_VERSION,
  currentMonth,
  sanitizeFlowSnapshot,
  useFlowStore,
  type FlowSnapshot,
} from "@/lib/storage/flow-store";
import { projectCashFlow } from "@/lib/finance/flow";
import { createFlowDemoSnapshot } from "@/lib/demo/flow";
import { FlowToolbar } from "@/components/tools/flow/flow-toolbar";
import { FlowStats } from "@/components/tools/flow/flow-stats";
import { FlowEditor } from "@/components/tools/flow/flow-editor";
import { FlowWhatIf } from "@/components/tools/flow/flow-what-if";
import { FlowMonthlyChart } from "@/components/tools/flow/flow-monthly-chart";
import { FlowBalanceChart } from "@/components/tools/flow/flow-balance-chart";
import { FlowTable } from "@/components/tools/flow/flow-table";
import { useMounted } from "@/components/tools/flow/use-mounted";

export function FlowTool() {
  const t = useTranslations("flow");
  const tTool = useTranslations("tools.flow");
  const tShared = useTranslations("shared");
  const locale = useLocale();
  const mounted = useMounted();

  const streams = useFlowStore((s) => s.streams);
  const startingBalance = useFlowStore((s) => s.startingBalance);
  const horizonMonths = useFlowStore((s) => s.horizonMonths);
  const currency = useFlowStore((s) => s.currency);
  const whatIfAdjustments = useFlowStore((s) => s.whatIfAdjustments);
  const addStream = useFlowStore((s) => s.addStream);
  const updateStream = useFlowStore((s) => s.updateStream);
  const removeStream = useFlowStore((s) => s.removeStream);
  const setHorizonMonths = useFlowStore((s) => s.setHorizonMonths);
  const setCurrency = useFlowStore((s) => s.setCurrency);
  const setWhatIfAdjustments = useFlowStore((s) => s.setWhatIfAdjustments);
  const resetWhatIf = useFlowStore((s) => s.resetWhatIf);
  const replaceState = useFlowStore((s) => s.replaceState);
  const reset = useFlowStore((s) => s.reset);

  const startMonth =
    mounted && streams.length > 0 ? streams[0].startMonth : currentMonth(new Date());

  const cashFlow = useMemo(() => {
    if (!mounted) return [];
    return projectCashFlow(
      streams,
      startingBalance,
      horizonMonths,
      startMonth,
      whatIfAdjustments
    );
  }, [mounted, streams, startingBalance, horizonMonths, startMonth, whatIfAdjustments]);

  const incomeCount = streams.filter((s) => s.category === "income").length;
  const expenseCount = streams.filter((s) => s.category === "expense").length;

  const currentIncome = useMemo(() => {
    const firstMonth = cashFlow[0];
    return firstMonth?.totalIncome ?? 0;
  }, [cashFlow]);

  const currentExpense = useMemo(() => {
    const firstMonth = cashFlow[0];
    return firstMonth?.totalExpense ?? 0;
  }, [cashFlow]);

  const endingBalance =
    cashFlow.length > 0 ? cashFlow[cashFlow.length - 1].balance : startingBalance;

  const netFlow = currentIncome - currentExpense;

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8" aria-busy="true">
        <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }

  function handleExport() {
    const snapshot: FlowSnapshot = {
      streams,
      startingBalance,
      horizonMonths,
      currency,
    };
    downloadJson(
      `finplan-${FLOW_TOOL_ID}-${new Date().toISOString().slice(0, 10)}.json`,
      createExportEnvelope(FLOW_TOOL_ID, FLOW_SCHEMA_VERSION, snapshot)
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, FLOW_TOOL_ID);
    if (envelope.schemaVersion !== FLOW_SCHEMA_VERSION) {
      throw new Error(t("error.importVersion"));
    }
    const snapshot = sanitizeFlowSnapshot(envelope.data);
    if (snapshot === null) {
      throw new Error(tShared("importError"));
    }
    replaceState(snapshot);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{tTool("title")}</h1>
        <p className="mt-1 text-muted-foreground">{tTool("description")}</p>
      </header>

      <FlowToolbar
        horizonMonths={horizonMonths}
        currency={currency}
        onHorizonChange={setHorizonMonths}
        onCurrencyChange={setCurrency}
        onSeed={() => replaceState(createFlowDemoSnapshot(new Date()))}
        onReset={reset}
        onExport={handleExport}
        onImport={handleImport}
        onResetWhatIf={resetWhatIf}
      />

      <FlowEditor
        streams={streams}
        currency={currency}
        startMonth={startMonth}
        onAdd={addStream}
        onUpdate={updateStream}
        onRemove={removeStream}
      />

      {streams.length > 0 ? (
        <FlowStats
          totalIncome={currentIncome}
          totalExpense={currentExpense}
          netFlow={netFlow}
          endingBalance={endingBalance}
          incomeCount={incomeCount}
          expenseCount={expenseCount}
          currency={currency}
          locale={locale}
        />
      ) : null}

      <FlowWhatIf
        streams={streams}
        adjustments={whatIfAdjustments}
        onAdjustmentsChange={setWhatIfAdjustments}
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <FlowMonthlyChart data={cashFlow} currency={currency} locale={locale} />
        <FlowBalanceChart data={cashFlow} currency={currency} locale={locale} />
      </div>

      <FlowTable data={cashFlow} currency={currency} locale={locale} />
    </div>
  );
}
