"use client";

import { useMemo, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";
import {
  TAX_SCHEMA_VERSION,
  TAX_TOOL_ID,
  sanitizeTaxSnapshot,
  setTranslationFn,
  useTaxStore,
  type TaxSnapshot,
} from "@/lib/storage/tax-store";
import { createTaxDemoSnapshot } from "@/lib/demo/tax";
import {
  computeProgressiveTax,
  taxableIncomeAfterDeductions,
} from "@/lib/finance/tax";
import { getCountryPreset } from "@/lib/finance/tax-presets";
import { TaxToolbar } from "@/components/tools/tax/tax-toolbar";
import { TaxStats } from "@/components/tools/tax/tax-stats";
import { DeductionPanel } from "@/components/tools/tax/deduction-panel";
import { BracketTable } from "@/components/tools/tax/bracket-table";
import { TakeHomeChart } from "@/components/tools/tax/take-home-chart";
import { useMounted } from "@/components/tools/tax/use-mounted";
import { localeTagOf } from "@/components/tools/tax/tax-format";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function TaxTool() {
  const t = useTranslations("tax");
  const tTool = useTranslations("tools.tax");
  const tShared = useTranslations("shared");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  useEffect(() => {
    setTranslationFn((key: string) => {
      try {
        return t(key);
      } catch {
        return key;
      }
    });
  }, [t]);

  const mounted = useMounted();

  const country = useTaxStore((state) => state.country);
  const filingStatus = useTaxStore((state) => state.filingStatus);
  const grossIncome = useTaxStore((state) => state.grossIncome);
  const deductions = useTaxStore((state) => state.deductions);
  const setCountry = useTaxStore((state) => state.setCountry);
  const setFilingStatus = useTaxStore((state) => state.setFilingStatus);
  const setGrossIncome = useTaxStore((state) => state.setGrossIncome);
  const toggleDeduction = useTaxStore((state) => state.toggleDeduction);
  const setDeductionAmount = useTaxStore((state) => state.setDeductionAmount);
  const addCustomDeduction = useTaxStore((state) => state.addCustomDeduction);
  const removeCustomDeduction = useTaxStore((state) => state.removeCustomDeduction);
  const replaceState = useTaxStore((state) => state.replaceState);
  const reset = useTaxStore((state) => state.reset);

  const computation = useMemo(() => {
    if (!mounted || grossIncome <= 0) return null;
    const enabledDeductions = deductions
      .filter((d) => d.enabled)
      .map((d) => d.amount);
    const taxableIncome = taxableIncomeAfterDeductions(grossIncome, enabledDeductions);
    const preset = getCountryPreset(country, filingStatus);
    return computeProgressiveTax(taxableIncome, preset.bands);
  }, [mounted, grossIncome, deductions, country, filingStatus]);

  const totalDeductions = useMemo(() => {
    if (!mounted) return 0;
    return round2(
      deductions
        .filter((d) => d.enabled)
        .reduce((sum, d) => sum + d.amount, 0)
    );
  }, [mounted, deductions]);

  const taxableIncome = useMemo(() => {
    if (!mounted || grossIncome <= 0) return 0;
    return taxableIncomeAfterDeductions(
      grossIncome,
      deductions.filter((d) => d.enabled).map((d) => d.amount)
    );
  }, [mounted, grossIncome, deductions]);

  const takeHome = useMemo(() => {
    if (!mounted || grossIncome <= 0) return 0;
    return round2(grossIncome - totalDeductions - (computation?.totalTax ?? 0));
  }, [mounted, grossIncome, totalDeductions, computation]);

  const takeHomeMonthly = useMemo(() => round2(takeHome / 12), [takeHome]);

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8" aria-busy="true">
        <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }

  function handleExport() {
    const snapshot: TaxSnapshot = {
      country,
      filingStatus,
      grossIncome,
      deductions: deductions.map((d) => ({
        id: d.id,
        name: d.name,
        amount: d.amount,
        enabled: d.enabled,
      })),
    };
    downloadJson(
      `finplan-${TAX_TOOL_ID}-${new Date().toISOString().slice(0, 10)}.json`,
      createExportEnvelope(TAX_TOOL_ID, TAX_SCHEMA_VERSION, snapshot)
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, TAX_TOOL_ID);
    if (envelope.schemaVersion !== TAX_SCHEMA_VERSION) {
      throw new Error(t("error.importVersion"));
    }
    const snapshot = sanitizeTaxSnapshot(envelope.data);
    if (snapshot === null) {
      throw new Error(tShared("importError"));
    }
    replaceState(snapshot);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {tTool("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{tTool("description")}</p>
      </header>

      <TaxToolbar
        country={country}
        onCountryChange={setCountry}
        onSeed={() => replaceState(createTaxDemoSnapshot(country, filingStatus))}
        onReset={reset}
        onExport={handleExport}
        onImport={handleImport}
      />

      <div className="space-y-3">
        <label
          htmlFor="tax-gross-income"
          className="block text-sm font-medium text-muted-foreground"
        >
          {t("incomeLabel")}
        </label>
        <input
          id="tax-gross-income"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={grossIncome === 0 ? "" : String(grossIncome)}
          onChange={(event) => {
            const cleaned = event.target.value.replace(/[\s,''\u00A0]/g, "");
            if (cleaned === "") {
              setGrossIncome(0);
              return;
            }
            const parsed = Number(cleaned);
            if (Number.isFinite(parsed) && parsed >= 0) {
              setGrossIncome(parsed);
            }
          }}
          placeholder="0"
          className="h-10 w-full max-w-md rounded-md border border-input bg-transparent px-3 text-lg shadow-sm tabular-nums placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {country === "us" ? (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            {t("filingStatus")}
          </span>
          <div className="flex gap-2">
            {(["single", "married"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilingStatus(status)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  filingStatus === status
                    ? "bg-emerald-500 text-white"
                    : "border border-border bg-transparent hover:bg-muted"
                }`}
              >
                {t(`filingOptions.${status}`)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {grossIncome > 0 ? (
        <TaxStats
          grossIncome={grossIncome}
          totalDeductions={totalDeductions}
          taxableIncome={taxableIncome}
          computation={computation}
          takeHome={takeHome}
          takeHomeMonthly={takeHomeMonthly}
          currency={getCountryPreset(country, filingStatus).currency}
          localeTag={localeTag}
        />
      ) : null}

      <DeductionPanel
        deductions={deductions}
        currency={getCountryPreset(country, filingStatus).currency}
        localeTag={localeTag}
        onToggle={toggleDeduction}
        onAmountChange={setDeductionAmount}
        onAdd={addCustomDeduction}
        onRemove={removeCustomDeduction}
      />

      {computation !== null ? (
        <BracketTable
          bands={computation.bands}
          currency={getCountryPreset(country, filingStatus).currency}
          localeTag={localeTag}
        />
      ) : null}

      <TakeHomeChart
        grossIncome={grossIncome}
        totalDeductions={totalDeductions}
        taxableIncome={taxableIncome}
        totalTax={computation?.totalTax ?? 0}
        takeHome={takeHome}
        currency={getCountryPreset(country, filingStatus).currency}
        localeTag={localeTag}
      />
    </div>
  );
}
