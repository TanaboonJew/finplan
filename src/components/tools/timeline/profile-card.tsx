"use client";

import { useTranslations } from "next-intl";
import { MoneyInput } from "@/components/shared/money-input";

const MAX_AGE = 120;
const MAX_RATE = 0.5;

const inputClasses =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface FieldShellProps {
  id: string;
  label: React.ReactNode;
  error?: React.ReactNode;
  suffix?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function FieldShell({
  id,
  label,
  error,
  suffix,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={`flex w-full flex-col gap-1.5 ${className ?? ""}`}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        {children}
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface ProfileCardProps {
  currentAge: number;
  monthlyBudget: number;
  annualReturnRate: number;
  inflationRate: number;
  currency: string;
  onCurrentAgeChange: (age: number) => void;
  onMonthlyBudgetChange: (value: number | null) => void;
  onAnnualReturnRateChange: (rate: number) => void;
  onInflationRateChange: (rate: number) => void;
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = MAX_AGE,
  error,
}: {
  id: string;
  label: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  error?: React.ReactNode;
}) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
        className={`${inputClasses} tabular-nums`}
      />
    </FieldShell>
  );
}

function PercentField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  error?: React.ReactNode;
}) {
  return (
    <FieldShell id={id} label={label} error={error} suffix="%">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={String(Number((value * 100).toPrecision(12)))}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[\s,'%\u00A0]/g, "");
          if (cleaned.length === 0) return;
          const parsed = Number(cleaned);
          if (Number.isFinite(parsed)) onChange(parsed / 100);
        }}
        className={`${inputClasses} pr-7 tabular-nums`}
      />
    </FieldShell>
  );
}

export function ProfileCard({
  currentAge,
  monthlyBudget,
  annualReturnRate,
  inflationRate,
  currency,
  onCurrentAgeChange,
  onMonthlyBudgetChange,
  onAnnualReturnRateChange,
  onInflationRateChange,
}: ProfileCardProps) {
  const t = useTranslations("timeline.profile");

  const ageError =
    currentAge < 0 || currentAge > MAX_AGE ? t("errors.ageRange") : undefined;

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">{t("title")}</h3>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
        <NumberField
          id="timeline-age"
          label={t("currentAge")}
          value={currentAge}
          min={0}
          max={MAX_AGE}
          error={ageError}
          onChange={onCurrentAgeChange}
        />
        <MoneyInput
          label={t("monthlyBudget")}
          currency={currency}
          value={monthlyBudget}
          onChange={onMonthlyBudgetChange}
        />
        <PercentField
          id="timeline-return"
          label={t("annualReturn")}
          value={annualReturnRate}
          error={
            annualReturnRate < 0 || annualReturnRate > MAX_RATE
              ? t("errors.ageRange")
              : undefined
          }
          onChange={onAnnualReturnRateChange}
        />
        <PercentField
          id="timeline-inflation"
          label={t("inflation")}
          value={inflationRate}
          error={
            inflationRate < 0 || inflationRate > MAX_RATE
              ? t("errors.ageRange")
              : undefined
          }
          onChange={onInflationRateChange}
        />
      </div>
    </section>
  );
}
