"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarCheck, HandCoins, PiggyBank, Receipt } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import {
  formatMoney,
  formatMonthYear,
  localeTagOf,
} from "@/components/tools/loan/loan-format";

export interface LoanStatsProps {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  payoffMonth: string | null;
  currency: string;
}

export function LoanStats({
  monthlyPayment,
  totalInterest,
  totalCost,
  payoffMonth,
  currency,
}: LoanStatsProps) {
  const t = useTranslations("loan.stats");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t("monthlyPayment")}
        value={formatMoney(monthlyPayment, localeTag, currency)}
        icon={<HandCoins className="size-4" aria-hidden />}
      />
      <StatCard
        label={t("totalInterest")}
        value={formatMoney(totalInterest, localeTag, currency)}
        icon={<PiggyBank className="size-4" />}
      />
      <StatCard
        label={t("totalCost")}
        value={formatMoney(totalCost, localeTag, currency)}
        icon={<Receipt className="size-4" aria-hidden />}
      />
      <StatCard
        label={t("payoffDate")}
        value={
          payoffMonth === null
            ? "—"
            : formatMonthYear(payoffMonth, localeTag)
        }
        icon={<CalendarCheck className="size-4" aria-hidden />}
      />
    </div>
  );
}
