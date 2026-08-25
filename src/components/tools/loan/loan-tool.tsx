"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";
import {
  LOAN_TOOL_ID,
  LOAN_SCHEMA_VERSION,
  currentMonth,
  sanitizeLoanToolPersisted,
  useLoanStore,
  type LoanToolPersisted,
} from "@/lib/storage/loan-store";
import { buildAmortizationSchedule, summarizeSchedule } from "@/lib/finance/amortization";
import { computeRefinanceBreakEven } from "@/lib/finance/refinance";
import { createLoanDemoState } from "@/lib/demo/loan";
import { LoanToolbar } from "@/components/tools/loan/loan-toolbar";
import { LoanInputs } from "@/components/tools/loan/loan-inputs";
import { LoanStats } from "@/components/tools/loan/loan-stats";
import { SplitChart } from "@/components/tools/loan/split-chart";
import { CumulativeChart } from "@/components/tools/loan/cumulative-chart";
import { AmortizationTable } from "@/components/tools/loan/amortization-table";
import { RefinancePanel } from "@/components/tools/loan/refinance-panel";
import { addMonthsToMonth } from "@/components/tools/loan/loan-format";
import { useMounted } from "@/components/tools/loan/use-mounted";

export function LoanTool() {
  const t = useTranslations("loan");
  const tTool = useTranslations("tools.loan");
  const tShared = useTranslations("shared");

  const mounted = useMounted();

  const loan = useLoanStore((state) => state.loan);
  const refinance = useLoanStore((state) => state.refinance);
  const currency = useLoanStore((state) => state.currency);
  const storedStartMonth = useLoanStore((state) => state.startMonth);
  const setLoan = useLoanStore((state) => state.setLoan);
  const setRefinance = useLoanStore((state) => state.setRefinance);
  const setCurrency = useLoanStore((state) => state.setCurrency);
  const setStartMonth = useLoanStore((state) => state.setStartMonth);
  const replaceState = useLoanStore((state) => state.replaceState);
  const reset = useLoanStore((state) => state.reset);

  const [refinanceOpen, setRefinanceOpen] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    principal?: string;
    annualRate?: string;
    termMonths?: string;
  }>({});

  const startMonth =
    mounted && storedStartMonth !== null
      ? storedStartMonth
      : currentMonth(new Date());

  const schedule = useMemo(() => {
    if (!mounted || loan === null) return [];
    if (loan.principal <= 0 || loan.termMonths <= 0 || loan.annualRate < 0)
      return [];
    try {
      return buildAmortizationSchedule({
        principal: loan.principal,
        annualRate: loan.annualRate,
        termMonths: loan.termMonths,
      });
    } catch {
      return [];
    }
  }, [mounted, loan]);

  const summary = useMemo(() => {
    if (schedule.length === 0) return null;
    return summarizeSchedule(schedule);
  }, [schedule]);

  const refinanceResult = useMemo(() => {
    if (!mounted || loan === null || refinance === null) return null;
    if (
      loan.principal <= 0 ||
      loan.termMonths <= 0 ||
      loan.annualRate < 0 ||
      refinance.newAnnualRate < 0 ||
      refinance.newTermMonths <= 0
    )
      return null;
    try {
      return computeRefinanceBreakEven(
        {
          principal: loan.principal,
          annualRate: loan.annualRate,
          termMonths: loan.termMonths,
        },
        {
          principal: loan.principal,
          annualRate: refinance.newAnnualRate,
          termMonths: refinance.newTermMonths,
        },
        refinance.closingCost
      );
    } catch {
      return null;
    }
  }, [mounted, loan, refinance]);

  function handleLoanFieldChange(
    field: "name" | "principal" | "annualRate" | "termMonths",
    value: string | number
  ) {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    const base = loan ?? {
      id: "",
      name: "",
      principal: 0,
      annualRate: 0,
      termMonths: 12,
    };
    const next = { ...base, [field]: value };
    if (field === "name" && typeof value === "string") {
      next.name = value;
    }
    if (field === "principal" && typeof value === "number") {
      next.principal = value;
    }
    if (field === "annualRate" && typeof value === "number") {
      next.annualRate = value;
    }
    if (field === "termMonths" && typeof value === "number") {
      next.termMonths = value;
    }
    setLoan(next);
  }

  function validateAndShowErrors(): boolean {
    const newErrors: typeof errors = {};
    const currentLoan = loan;
    if (!currentLoan) {
      newErrors.name = t("inputs.validation.nameRequired");
      setErrors(newErrors);
      return false;
    }
    if (!currentLoan.name.trim()) {
      newErrors.name = t("inputs.validation.nameRequired");
    }
    if (currentLoan.principal <= 0) {
      newErrors.principal = t("inputs.validation.principalPositive");
    }
    if (currentLoan.annualRate < 0) {
      newErrors.annualRate = t("inputs.validation.rateNonNegative");
    }
    if (currentLoan.termMonths <= 0) {
      newErrors.termMonths = t("inputs.validation.termPositive");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleExport() {
    if (!validateAndShowErrors()) return;
    const snapshot: LoanToolPersisted = {
      loan,
      refinance,
      currency,
      startMonth: storedStartMonth,
    };
    downloadJson(
      `finplan-${LOAN_TOOL_ID}-${new Date().toISOString().slice(0, 10)}.json`,
      createExportEnvelope(LOAN_TOOL_ID, LOAN_SCHEMA_VERSION, snapshot)
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, LOAN_TOOL_ID);
    if (envelope.schemaVersion !== LOAN_SCHEMA_VERSION) {
      throw new Error(t("error.importVersion"));
    }
    const snapshot = sanitizeLoanToolPersisted(envelope.data);
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

  const payoffMonth =
    summary !== null && startMonth !== null
      ? addMonthsToMonth(startMonth, summary.months - 1)
      : null;

  const hasLoan = loan !== null && loan.name.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {tTool("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{tTool("description")}</p>
      </header>

      <LoanToolbar
        currency={currency}
        startMonth={startMonth}
        onCurrencyChange={setCurrency}
        onStartMonthChange={setStartMonth}
        onSeed={() => replaceState(createLoanDemoState(new Date()))}
        onReset={reset}
        onExport={handleExport}
        onImport={handleImport}
      />

      <LoanInputs
        name={loan?.name ?? ""}
        principal={loan?.principal ?? 0}
        annualRate={loan?.annualRate ?? 0}
        termMonths={loan?.termMonths ?? 12}
        currency={currency}
        onNameChange={(value) => handleLoanFieldChange("name", value)}
        onPrincipalChange={(value) => handleLoanFieldChange("principal", value)}
        onAnnualRateChange={(value) => handleLoanFieldChange("annualRate", value)}
        onTermMonthsChange={(value) => handleLoanFieldChange("termMonths", value)}
        errors={errors}
      />

      {hasLoan && summary !== null ? (
        <LoanStats
          monthlyPayment={
            schedule.length > 0 ? schedule[0].payment : 0
          }
          totalInterest={summary.totalInterest}
          totalCost={summary.totalPaid}
          payoffMonth={payoffMonth}
          currency={currency}
        />
      ) : null}

      {hasLoan && schedule.length > 0 ? (
        <>
          <SplitChart schedule={schedule} currency={currency} />
          <CumulativeChart schedule={schedule} currency={currency} />
          <AmortizationTable
            schedule={schedule}
            startMonth={startMonth}
            currency={currency}
          />
        </>
      ) : null}

      {hasLoan ? (
        <RefinancePanel
          isOpen={refinanceOpen}
          onToggle={() => setRefinanceOpen((prev) => !prev)}
          newAnnualRate={refinance?.newAnnualRate ?? 0}
          closingCost={refinance?.closingCost ?? 0}
          newTermMonths={refinance?.newTermMonths ?? loan?.termMonths ?? 12}
          onNewAnnualRateChange={(value) => {
            const base = refinance ?? {
              newAnnualRate: 0,
              closingCost: 0,
              newTermMonths: loan?.termMonths ?? 12,
            };
            setRefinance({ ...base, newAnnualRate: value });
          }}
          onClosingCostChange={(value) => {
            const base = refinance ?? {
              newAnnualRate: 0,
              closingCost: 0,
              newTermMonths: loan?.termMonths ?? 12,
            };
            setRefinance({ ...base, closingCost: value });
          }}
          onNewTermMonthsChange={(value) => {
            const base = refinance ?? {
              newAnnualRate: 0,
              closingCost: 0,
              newTermMonths: loan?.termMonths ?? 12,
            };
            setRefinance({ ...base, newTermMonths: value });
          }}
          result={refinanceResult}
          currency={currency}
        />
      ) : null}
    </div>
  );
}
