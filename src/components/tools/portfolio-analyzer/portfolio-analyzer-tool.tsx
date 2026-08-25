"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { PieChart, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import {
  allocations,
  concentrationWarnings,
  driftVsTargets,
  largestDrift,
  totalValue,
} from "@/lib/finance/portfolio";
import { usePortfolioStore } from "@/lib/storage/portfolio-store";
import { useMounted } from "./use-mounted";
import { PortfolioToolbar } from "./portfolio-toolbar";
import { PastePanel, useMoney } from "./portfolio-paste";
import { AllocationDonut } from "./allocation-donut";
import { DriftTable, WarningsList } from "./analysis-panels";
import { HoldingsEditor, TargetsEditor } from "./holdings-editor";

export function PortfolioAnalyzerTool() {
  const t = useTranslations("portfolio-analyzer");
  const money = useMoney();
  const mounted = useMounted();

  const holdings = usePortfolioStore((state) => state.holdings);
  const targets = usePortfolioStore((state) => state.targets);

  const total = useMemo(() => totalValue(holdings), [holdings]);
  const allocs = useMemo(() => allocations(holdings), [holdings]);
  const warnings = useMemo(() => concentrationWarnings(holdings), [holdings]);
  const driftRows = useMemo(
    () => driftVsTargets(holdings, targets),
    [holdings, targets]
  );
  const worstDrift = useMemo(() => largestDrift(driftRows), [driftRows]);

  const worstPositionWeight = useMemo(() => {
    let max = 0;
    for (const w of warnings) {
      if (w.weight > max) max = w.weight;
    }
    return max;
  }, [warnings]);

  if (!mounted) {
    return (
      <div
        className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10"
        aria-busy="true"
      >
        <span className="sr-only">{t("loading")}</span>
        <div className="flex animate-pulse flex-col gap-6">
          <div className="h-9 w-64 rounded-md bg-muted" />
          <div className="h-40 rounded-lg bg-muted" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
          </div>
          <div className="h-64 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <PortfolioToolbar />
      </header>

      <PastePanel />

      <section
        aria-label={t("stats.label")}
        className="grid gap-3 sm:grid-cols-3"
      >
        <StatCard
          label={t("stats.totalValue")}
          value={money(total)}
          sublabel={t("stats.positions", { count: holdings.length })}
          icon={<Wallet className="size-4" />}
        />
        <StatCard
          label={t("stats.classes")}
          value={`${allocs.length}`}
          icon={<PieChart className="size-4" />}
        />
        <StatCard
          label={t("stats.largestDrift")}
          value={
            holdings.length === 0 || !worstDrift
              ? "—"
              : `${worstDrift.assetClass} ${
                  worstDrift.delta >= 0 ? "+" : ""
                }${(worstDrift.delta * 100).toFixed(1)}%`
          }
          tone={
            !worstDrift || Math.abs(worstDrift.delta) <= 0.001
              ? "default"
              : worstDrift.delta > 0
                ? "positive"
                : "negative"
          }
          icon={
            worstDrift && worstDrift.delta > 0 ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )
          }
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <AllocationDonut allocations={allocs} formatMoney={money} />

        <div className="flex flex-col gap-6">
          <WarningsList warnings={warnings} />
          {worstPositionWeight > 0 && (
            <p className="sr-only" aria-live="polite">
              {t("warnings.title")}
            </p>
          )}
          <DriftTable rows={driftRows} />
        </div>
      </div>

      <HoldingsEditor holdings={holdings} />

      <TargetsEditor classes={allocs.map((a) => a.assetClass)} />

      {holdings.length > 0 && (
        <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
      )}
    </div>
  );
}
