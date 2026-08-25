"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";
import {
  DCA_TOOL_ID,
  DCA_SCHEMA_VERSION,
  createDefaultFund,
  sanitizeDcaToolPersisted,
  useDcaStore,
  type DcaToolPersisted,
  type DcaFundInput,
} from "@/lib/storage/dca-store";
import { compareDcaFunds, type DcaFundParams } from "@/lib/finance/dca";
import { createDcaDemoState } from "@/lib/demo/dca";
import { DcaToolbar } from "@/components/tools/dca/dca-toolbar";
import { DcaFundInputs } from "@/components/tools/dca/dca-fund-inputs";
import { DcaStats } from "@/components/tools/dca/dca-stats";
import { DcaComparisonChart } from "@/components/tools/dca/dca-comparison-chart";
import { DcaFeeChart } from "@/components/tools/dca/dca-fee-chart";
import { DcaBreakeven } from "@/components/tools/dca/dca-breakeven";
import { useMounted } from "@/components/tools/dca/use-mounted";

function toFundParams(fund: DcaFundInput): DcaFundParams {
  return {
    name: fund.name,
    expenseRatio: fund.expenseRatio,
    frontLoad: fund.frontLoad,
    exitLoad: fund.exitLoad,
    annualReturn: fund.annualReturn,
  };
}

export function DcaTool() {
  const t = useTranslations("dca");
  const tTool = useTranslations("tools.dca");
  const tShared = useTranslations("shared");

  const mounted = useMounted();

  const funds = useDcaStore((state) => state.funds);
  const monthlyContribution = useDcaStore((state) => state.monthlyContribution);
  const horizonMonths = useDcaStore((state) => state.horizonMonths);
  const currency = useDcaStore((state) => state.currency);
  const addFund = useDcaStore((state) => state.addFund);
  const updateFund = useDcaStore((state) => state.updateFund);
  const removeFund = useDcaStore((state) => state.removeFund);
  const setMonthlyContribution = useDcaStore((state) => state.setMonthlyContribution);
  const setHorizonMonths = useDcaStore((state) => state.setHorizonMonths);
  const setCurrency = useDcaStore((state) => state.setCurrency);
  const replaceState = useDcaStore((state) => state.replaceState);
  const reset = useDcaStore((state) => state.reset);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const validFunds = useMemo(
    () => funds.filter((f) => f.name.trim().length > 0),
    [funds]
  );

  const results = useMemo(() => {
    if (!mounted || validFunds.length < 2 || monthlyContribution <= 0 || horizonMonths <= 0) {
      return [];
    }
    try {
      return compareDcaFunds(
        validFunds.map(toFundParams),
        monthlyContribution,
        horizonMonths
      );
    } catch {
      return [];
    }
  }, [mounted, validFunds, monthlyContribution, horizonMonths]);

  function validateAndShowErrors(): boolean {
    const newErrors: Record<string, string | undefined> = {};
    if (monthlyContribution <= 0) {
      newErrors.contribution = t("params.validation.contributionPositive");
    }
    if (horizonMonths < 12 || horizonMonths > 600) {
      newErrors.horizon = t("params.validation.horizonRange");
    }
    if (validFunds.length < 2) {
      newErrors.funds = t("funds.validation.minFunds");
    }
    for (const fund of funds) {
      if (!fund.name.trim()) {
        newErrors[`fund-${fund.id}-name`] = t("funds.validation.nameRequired");
      }
      if (fund.expenseRatio < 0 || fund.expenseRatio >= 1) {
        newErrors[`fund-${fund.id}-expense`] = t("funds.validation.rateRange");
      }
      if (fund.frontLoad < 0 || fund.frontLoad >= 1) {
        newErrors[`fund-${fund.id}-front`] = t("funds.validation.rateRange");
      }
      if (fund.exitLoad < 0 || fund.exitLoad >= 1) {
        newErrors[`fund-${fund.id}-exit`] = t("funds.validation.rateRange");
      }
      if (fund.annualReturn < 0 || fund.annualReturn > 0.5) {
        newErrors[`fund-${fund.id}-return`] = t("funds.validation.returnRange");
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleAddFund() {
    if (funds.length >= 4) return;
    addFund(createDefaultFund());
  }

  function handleUpdateFund(id: string, patch: Partial<Omit<DcaFundInput, "id">>) {
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.startsWith(`fund-${id}-`)) delete next[key];
      }
      return next;
    });
    updateFund(id, patch);
  }

  function handleRemoveFund(id: string) {
    if (funds.length <= 2) return;
    removeFund(id);
  }

  function handleExport() {
    if (!validateAndShowErrors()) return;
    const snapshot: DcaToolPersisted = {
      funds,
      monthlyContribution,
      horizonMonths,
      currency,
    };
    downloadJson(
      `finplan-${DCA_TOOL_ID}-${new Date().toISOString().slice(0, 10)}.json`,
      createExportEnvelope(DCA_TOOL_ID, DCA_SCHEMA_VERSION, snapshot)
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, DCA_TOOL_ID);
    if (envelope.schemaVersion !== DCA_SCHEMA_VERSION) {
      throw new Error(t("error.importVersion"));
    }
    const snapshot = sanitizeDcaToolPersisted(envelope.data);
    if (snapshot === null) {
      throw new Error(tShared("importError"));
    }
    replaceState(snapshot);
  }

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8" aria-busy="true">
        <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {tTool("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <DcaToolbar
        currency={currency}
        onCurrencyChange={setCurrency}
        onSeed={() => replaceState(createDcaDemoState())}
        onReset={reset}
        onExport={handleExport}
        onImport={handleImport}
      />

      <DcaFundInputs
        funds={funds}
        monthlyContribution={monthlyContribution}
        horizonMonths={horizonMonths}
        onMonthlyContributionChange={setMonthlyContribution}
        onHorizonMonthsChange={setHorizonMonths}
        onAddFund={handleAddFund}
        onUpdateFund={handleUpdateFund}
        onRemoveFund={handleRemoveFund}
        errors={errors}
      />

      {results.length > 0 ? (
        <>
          <DcaStats results={results} currency={currency} />
          <DcaComparisonChart results={results} currency={currency} />
          <DcaFeeChart results={results} currency={currency} />
          <DcaBreakeven
            results={results}
            monthlyContribution={monthlyContribution}
          />
        </>
      ) : null}
    </div>
  );
}
