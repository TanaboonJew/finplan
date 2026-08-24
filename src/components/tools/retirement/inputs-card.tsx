"use client";

import { useTranslations } from "next-intl";
import { MoneyInput } from "@/components/shared/money-input";
import {
  NumberField,
  PercentField,
} from "@/components/tools/retirement/fields";
import {
  MAX_AGE,
  MIN_WITHDRAWAL_RATE,
  type RetirementSnapshot,
} from "@/lib/storage/retirement-store";

export interface InputsCardProps {
  profile: RetirementSnapshot;
  onChange: (patch: Partial<RetirementSnapshot>) => void;
}

export function InputsCard({ profile, onChange }: InputsCardProps) {
  const t = useTranslations("retirement.inputs");

  const ageOrderError =
    profile.retirementAge <= profile.currentAge ? t("errors.ageOrder") : undefined;
  const returnError =
    profile.annualReturnRate < 0 || profile.annualReturnRate > 0.5
      ? t("errors.rangeReturn")
      : undefined;
  const inflationError =
    profile.inflationRate < 0 || profile.inflationRate > 0.5
      ? t("errors.rangeInflation")
      : undefined;
  const withdrawalError =
    profile.withdrawalRate < MIN_WITHDRAWAL_RATE ||
    profile.withdrawalRate > 0.2
      ? t("errors.rangeWithdrawal")
      : undefined;

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">{t("title")}</h3>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
        <NumberField
          label={t("currentAge")}
          value={profile.currentAge}
          min={0}
          max={MAX_AGE}
          onChange={(value) => onChange({ currentAge: value })}
        />
        <NumberField
          label={t("retirementAge")}
          value={profile.retirementAge}
          error={ageOrderError}
          min={0}
          max={MAX_AGE}
          onChange={(value) => onChange({ retirementAge: value })}
        />
        <MoneyInput
          label={t("currentSavings")}
          currency={profile.currency}
          value={profile.currentSavings}
          onChange={(value) =>
            onChange({ currentSavings: value ?? 0 })
          }
        />
        <MoneyInput
          label={t("monthlyContribution")}
          currency={profile.currency}
          value={profile.monthlyContribution}
          onChange={(value) =>
            onChange({ monthlyContribution: value ?? 0 })
          }
        />
        <PercentField
          label={t("annualReturn")}
          value={profile.annualReturnRate}
          error={returnError}
          onChange={(value) => onChange({ annualReturnRate: value })}
        />
        <PercentField
          label={t("inflation")}
          value={profile.inflationRate}
          error={inflationError}
          onChange={(value) => onChange({ inflationRate: value })}
        />
        <div>
          <MoneyInput
            label={t("desiredIncome")}
            currency={profile.currency}
            value={profile.desiredRetirementIncome}
            onChange={(value) =>
              onChange({ desiredRetirementIncome: value ?? 0 })
            }
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("desiredIncomeHint")}
          </p>
        </div>
        <PercentField
          label={t("withdrawalRate")}
          value={profile.withdrawalRate}
          error={withdrawalError}
          onChange={(value) => onChange({ withdrawalRate: value })}
        />
      </div>
    </section>
  );
}
