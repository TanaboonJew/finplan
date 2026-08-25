"use client";

import { CreditCard, DollarSign, Percent, Trophy } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import type { CardComparisonResult } from "@/lib/finance/credit-card";
import { useMoney } from "./credit-card-format";
import { useTranslations } from "next-intl";

interface CreditCardStatsProps {
  results: CardComparisonResult[];
  totalSpend: number;
}

export function CreditCardStats({ results, totalSpend }: CreditCardStatsProps) {
  const t = useTranslations("credit-card.stats");
  const money = useMoney();

  const bestCard = results[0] ?? null;
  const avgEffectiveRate =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.effectiveRate, 0) / results.length
      : 0;

  return (
    <section
      aria-label={t("label")}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard
        label={t("bestCard")}
        value={bestCard ? bestCard.cardName : "—"}
        icon={<Trophy className="size-4" />}
        sublabel={
          bestCard ? money.currency(bestCard.netAnnualValue) + " " + t("netValue") : undefined
        }
        tone={bestCard && bestCard.netAnnualValue > 0 ? "positive" : "default"}
      />
      <StatCard
        label={t("totalSpend")}
        value={money.currency(totalSpend)}
        icon={<DollarSign className="size-4" />}
        sublabel={t("totalSpendSub", { count: results.length })}
      />
      <StatCard
        label={t("avgEffRate")}
        value={money.rate(avgEffectiveRate)}
        icon={<Percent className="size-4" />}
        sublabel={t("avgEffRateSub")}
        tone={avgEffectiveRate > 0 ? "positive" : "default"}
      />
      <StatCard
        label={t("cardsCompared")}
        value={String(results.length)}
        icon={<CreditCard className="size-4" />}
        sublabel={t("cardsComparedSub")}
      />
    </section>
  );
}
