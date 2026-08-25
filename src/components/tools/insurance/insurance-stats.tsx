"use client";

import { FileText, DollarSign, Users, BarChart3 } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import type { InsurancePolicy } from "@/lib/finance/insurance";
import { totalAnnualPremiums } from "@/lib/finance/insurance";
import { useMoney } from "./insurance-format";
import { useTranslations } from "next-intl";

interface InsuranceStatsProps {
  policies: InsurancePolicy[];
  membersCount: number;
}

export function InsuranceStats({ policies, membersCount }: InsuranceStatsProps) {
  const t = useTranslations("insurance.stats");
  const money = useMoney();

  const totalAnnual = totalAnnualPremiums(policies);
  const avgPerMember =
    membersCount > 0
      ? policies.length / membersCount
      : 0;

  return (
    <section
      aria-label={t("label")}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard
        label={t("totalPolicies")}
        value={String(policies.length)}
        icon={<FileText className="size-4" />}
        sublabel={t("totalPoliciesSub", { count: policies.length })}
      />
      <StatCard
        label={t("annualPremiums")}
        value={money.currency(totalAnnual)}
        icon={<DollarSign className="size-4" />}
        sublabel={t("annualPremiumsSub")}
      />
      <StatCard
        label={t("membersCount")}
        value={String(membersCount)}
        icon={<Users className="size-4" />}
        sublabel={t("membersCountSub")}
      />
      <StatCard
        label={t("avgPerMember")}
        value={avgPerMember.toFixed(1)}
        icon={<BarChart3 className="size-4" />}
        sublabel={t("avgPerMemberSub")}
      />
    </section>
  );
}
