"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Coins, PiggyBank, ShoppingBag } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import {
  computeJarActivity,
  summarizeJars,
  validateJarSplit,
} from "@/lib/finance/jars";
import { useJarStore } from "@/lib/storage/jar-store";
import { BalancesChart } from "./balances-chart";
import { useMoney } from "./controls";
import { IncomeCard } from "./income-card";
import { JarToolbar } from "./jar-toolbar";
import { JarsGrid } from "./jars-grid";
import { TransfersCard } from "./transfers-card";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

const CLASSIC_JARS = [
  { key: "necessities", percent: 0.55 },
  { key: "financialFreedom", percent: 0.1 },
  { key: "education", percent: 0.1 },
  { key: "longTermSavings", percent: 0.1 },
  { key: "play", percent: 0.1 },
  { key: "give", percent: 0.05 },
] as const;

export function JarTool() {
  const t = useTranslations("jar");
  const money = useMoney();

  const jars = useJarStore((state) => state.jars);
  const incomes = useJarStore((state) => state.incomes);
  const expenses = useJarStore((state) => state.expenses);
  const transfers = useJarStore((state) => state.transfers);

  const mounted = useMounted();

  const activity = useMemo(
    () => computeJarActivity(incomes, expenses, transfers),
    [incomes, expenses, transfers]
  );
  const summary = useMemo(
    () => summarizeJars(incomes, expenses, transfers),
    [incomes, expenses, transfers]
  );
  const splitCheck = useMemo(() => validateJarSplit(jars), [jars]);
  const referencedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const income of incomes) {
      for (const allocation of income.allocations) ids.add(allocation.jarId);
    }
    for (const expense of expenses) ids.add(expense.jarId);
    for (const transfer of transfers) {
      ids.add(transfer.fromJarId);
      ids.add(transfer.toJarId);
    }
    return ids;
  }, [incomes, expenses, transfers]);

  const resolveName = useCallback(
    (jarId: string) =>
      jars.find((jar) => jar.id === jarId)?.name ?? t("jars.unknownJar"),
    [jars, t]
  );

  function loadClassicJars() {
    const store = useJarStore.getState();
    for (const classic of CLASSIC_JARS) {
      const id = store.addJar(t(`jars.classic.${classic.key}`));
      store.updateJar(id, { allocationPercent: classic.percent });
    }
  }

  if (!mounted) {
    return (
      <div
        className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10"
        aria-busy="true"
      >
        <span className="sr-only">{t("loading")}</span>
        <div className="flex animate-pulse flex-col gap-6">
          <div className="h-9 w-64 rounded-md bg-muted" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
          </div>
          <div className="h-56 rounded-lg bg-muted" />
          <div className="h-72 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <JarToolbar
          slice={{ jars, incomes, expenses, transfers }}
        />
      </header>

      <section
        aria-label={t("stats.label")}
        className="grid gap-3 sm:grid-cols-3"
      >
        <StatCard
          label={t("stats.incomeLabel")}
          value={money.currency(summary.totalIncome)}
          icon={<Coins className="size-4" />}
        />
        <StatCard
          label={t("stats.spentLabel")}
          value={money.currency(summary.totalSpent)}
          icon={<ShoppingBag className="size-4" />}
        />
        <StatCard
          label={t("stats.netOnHandLabel")}
          value={money.currency(summary.netOnHand)}
          tone={summary.netOnHand >= 0 ? "positive" : "negative"}
          icon={<PiggyBank className="size-4" />}
          sublabel={`${t("stats.transferredLabel")}: ${money.currency(summary.totalTransferred)}`}
        />
      </section>

      <IncomeCard
        jars={jars}
        incomes={incomes}
        splitTotal={splitCheck.totalPercent}
        resolveName={resolveName}
        onDistribute={(entry) => useJarStore.getState().addIncome(entry)}
        onRemove={(id) => useJarStore.getState().removeIncome(id)}
      />

      <JarsGrid
        jars={jars}
        activity={activity}
        referencedIds={referencedIds}
        splitTotal={splitCheck.totalPercent}
        resolveName={resolveName}
        onAddJar={() =>
          useJarStore.getState().addJar(t("jars.newJarDefault"))
        }
        onLoadClassic={loadClassicJars}
        onUpdateJar={(id, patch) => useJarStore.getState().updateJar(id, patch)}
        onRemoveJar={(id) => useJarStore.getState().removeJar(id)}
        onSpend={(jarId, entry) => useJarStore.getState().addExpense({ jarId, ...entry })}
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <TransfersCard
          jars={jars}
          activity={activity}
          transfers={transfers}
          resolveName={resolveName}
          onTransfer={(entry) => useJarStore.getState().addTransfer(entry)}
          onRemove={(id) => useJarStore.getState().removeTransfer(id)}
        />
        <BalancesChart jars={jars} activity={activity} />
      </div>
    </div>
  );
}
