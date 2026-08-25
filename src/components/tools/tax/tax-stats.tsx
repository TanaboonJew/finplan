"use client";

import { useTranslations } from "next-intl";
import { CircleDollarSign, Receipt, Landmark, Banknote, Percent, PiggyBank } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import type { TaxComputation } from "@/lib/finance/tax";
import { formatMoney, formatPercent } from "@/components/tools/tax/tax-format";

export interface TaxStatsProps {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  computation: TaxComputation | null;
  takeHome: number;
  takeHomeMonthly: number;
  currency: string;
  localeTag: string;
}

export function TaxStats({
  grossIncome,
  totalDeductions,
  taxableIncome,
  computation,
  takeHome,
  takeHomeMonthly,
  currency,
  localeTag,
}: TaxStatsProps) {
  const t = useTranslations("tax.stats");

  const totalTax = computation?.totalTax ?? 0;
  const effectiveRate = computation?.effectiveRate ?? 0;
  const marginalRate = computation?.marginalRate ?? 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        label={t("grossIncome")}
        value={formatMoney(grossIncome, localeTag, currency)}
        icon={<CircleDollarSign className="size-4" aria-hidden />}
      />
      <StatCard
        label={t("totalDeductions")}
        value={formatMoney(totalDeductions, localeTag, currency)}
        icon={<Receipt className="size-4" aria-hidden />}
      />
      <StatCard
        label={t("taxableIncome")}
        value={formatMoney(taxableIncome, localeTag, currency)}
        icon={<Landmark className="size-4" aria-hidden />}
      />
      <StatCard
        label={t("totalTax")}
        value={formatMoney(totalTax, localeTag, currency)}
        sublabel={t("effectiveRate", { rate: formatPercent(effectiveRate) })}
        icon={<Banknote className="size-4" aria-hidden />}
      />
      <StatCard
        label={t("marginalRate")}
        value={formatPercent(marginalRate)}
        icon={<Percent className="size-4" aria-hidden />}
      />
      <StatCard
        label={t("takeHomePay")}
        value={formatMoney(takeHome, localeTag, currency)}
        sublabel={t("takeHomeMonthly", { amount: formatMoney(takeHomeMonthly, localeTag, currency) })}
        tone="positive"
        icon={<PiggyBank className="size-4" aria-hidden />}
      />
    </div>
  );
}
