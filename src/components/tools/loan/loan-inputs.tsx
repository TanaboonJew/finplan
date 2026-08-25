"use client";

import { useTranslations } from "next-intl";
import { Wallet } from "lucide-react";
import { MoneyInput } from "@/components/shared/money-input";
import { PercentInput } from "@/components/tools/loan/percent-input";
import { TextField } from "@/components/tools/loan/text-field";

export interface LoanInputsProps {
  name: string;
  principal: number;
  annualRate: number;
  termMonths: number;
  currency: string;
  onNameChange: (name: string) => void;
  onPrincipalChange: (principal: number) => void;
  onAnnualRateChange: (rate: number) => void;
  onTermMonthsChange: (months: number) => void;
  errors: {
    name?: string;
    principal?: string;
    annualRate?: string;
    termMonths?: string;
  };
}

export function LoanInputs({
  name,
  principal,
  annualRate,
  termMonths,
  currency,
  onNameChange,
  onPrincipalChange,
  onAnnualRateChange,
  onTermMonthsChange,
  errors,
}: LoanInputsProps) {
  const t = useTranslations("loan.inputs");

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <Wallet className="size-4 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold">{t("titleLabel")}</h3>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label={t("nameLabel")}
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          error={errors.name}
        />
        <MoneyInput
          label={t("principalLabel")}
          value={principal || null}
          onChange={(value) => onPrincipalChange(value ?? 0)}
          currency={currency}
          placeholder="0"
        />
        <PercentInput
          label={t("aprLabel")}
          value={annualRate || null}
          onChange={(value) => onAnnualRateChange(value ?? 0)}
          error={errors.annualRate}
        />
        <div className="flex w-full flex-col gap-1.5">
          <TextField
            label={t("termLabel")}
            value={String(termMonths)}
            onChange={(event) => {
              const parsed = parseInt(event.target.value, 10);
              onTermMonthsChange(Number.isFinite(parsed) ? parsed : 0);
            }}
            error={errors.termMonths}
          />
          <p className="text-xs text-muted-foreground">{t("termHint")}</p>
        </div>
      </div>
    </section>
  );
}
