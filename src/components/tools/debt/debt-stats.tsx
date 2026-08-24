"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarCheck, HandCoins, PiggyBank, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import {
  formatMoney,
  formatMonthYear,
  localeTagOf,
} from "@/components/tools/debt/debt-format";

export interface DebtStatsProps {
  totalBalance: number;
  debtCount: number;
  monthlyMinimums: number;
  extraMonthlyPayment: number;
  currency: string;
  debtFreeMonth: string | null;
  interestSaved: number;
}

export function DebtStats({
  totalBalance,
  debtCount,
  monthlyMinimums,
  extraMonthlyPayment,
  currency,
  debtFreeMonth,
  interestSaved,
}: DebtStatsProps) {
  const t = useTranslations("debt.stats");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t("totalBalance")}
        value={formatMoney(totalBalance, localeTag, currency)}
        sublabel={t("totalBalanceSub", { count: debtCount })}
        icon={<Wallet className="size-4" aria-hidden />}
      />
      <StatCard
        label={t("monthlyMinimums")}
        value={formatMoney(
          monthlyMinimums + extraMonthlyPayment,
          localeTag,
          currency
        )}
        icon={<HandCoins className="size-4" aria-hidden />}
      />
      <StatCard
        label={t("debtFreeBy")}
        value={debtFreeMonth === null ? "—" : formatMonthYear(debtFreeMonth, localeTag)}
        icon={<CalendarCheck className="size-4" aria-hidden />}
      />
      <StatCard
        label={t("interestSaved")}
        value={formatMoney(interestSaved, localeTag, currency)}
        sublabel={t("interestSavedSub")}
        tone={interestSaved > 0 ? "positive" : "default"}
        icon={<PiggyBank className="size-4" aria-hidden />}
      />
    </div>
  );
}
