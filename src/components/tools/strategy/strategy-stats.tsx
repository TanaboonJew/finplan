import { useTranslations } from "next-intl";
import { StatCard } from "@/components/shared/stat-card";
import {
  summarizeAllTheses,
  type Thesis,
} from "@/lib/finance/strategy";
import { formatPercent } from "./strategy-format";

export function StrategyStats({ theses }: { theses: Thesis[] }) {
  const t = useTranslations("strategy.stats");
  const summaries = summarizeAllTheses(theses);

  const total = summaries.length;
  const active = summaries.filter((s) => s.status === "active").length;
  const avgReturn =
    summaries.length > 0
      ? summaries.reduce((sum, s) => sum + s.weightedReturn, 0) /
        summaries.length
      : 0;
  const highRisks = summaries.reduce((sum, s) => sum + s.highRiskCount, 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label={t("totalTheses")} value={total} />
      <StatCard label={t("activeTheses")} value={active} />
      <StatCard
        label={t("avgReturn")}
        value={formatPercent(avgReturn)}
        sublabel={t("avgReturnSub")}
      />
      <StatCard
        label={t("highRisks")}
        value={highRisks}
        tone={highRisks > 0 ? "negative" : "positive"}
      />
    </div>
  );
}
