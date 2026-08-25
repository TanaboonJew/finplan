"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Castle, TrendingUp, Trophy } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import {
  totalWealth,
  totalTarget,
  buildingsCompleted,
} from "@/lib/finance/kingdom";
import { useKingdomStore } from "@/lib/storage/kingdom-store";
import { useMoney } from "./controls";
import { KingdomToolbar } from "./kingdom-toolbar";
import { KingdomGrid } from "./kingdom-grid";
import { AddBuildingForm } from "./add-building-form";
import { AchievementsPanel } from "./achievements-panel";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function KingdomTool() {
  const t = useTranslations("kingdom");
  const money = useMoney();

  const kingdomName = useKingdomStore((s) => s.kingdomName);
  const buildings = useKingdomStore((s) => s.buildings);
  const achievements = useKingdomStore((s) => s.achievements);
  const deposits = useKingdomStore((s) => s.deposits);

  const mounted = useMounted();

  const wealth = useMemo(() => totalWealth(buildings), [buildings]);
  const target = useMemo(() => totalTarget(buildings), [buildings]);
  const completed = useMemo(() => buildingsCompleted(buildings), [buildings]);
  const unlockedCount = useMemo(
    () => achievements.filter((a) => a.unlockedAt !== null).length,
    [achievements]
  );

  const slice = useMemo(
    () => ({ kingdomName, buildings, deposits, achievements }),
    [kingdomName, buildings, deposits, achievements]
  );

  const handleSetName = useCallback((e: React.FocusEvent<HTMLSpanElement>) => {
    const newName = e.target.textContent?.trim();
    if (newName && newName !== kingdomName) {
      useKingdomStore.getState().setKingdomName(newName);
    }
  }, [kingdomName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    },
    []
  );

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-40 rounded-lg bg-muted" />
            <div className="h-40 rounded-lg bg-muted" />
            <div className="h-40 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            contentEditable
            suppressContentEditableWarning
            onBlur={handleSetName}
            onKeyDown={handleKeyDown}
            role="textbox"
            aria-label={t("kingdomNameLabel")}
          >
            {kingdomName}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <KingdomToolbar slice={slice} />
      </header>

      <section
        aria-label={t("stats.label")}
        className="grid gap-3 sm:grid-cols-3"
      >
        <StatCard
          label={t("stats.totalWealthLabel")}
          value={money.currency(wealth)}
          sublabel={`${t("stats.ofTarget")}: ${money.currency(target)}`}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label={t("stats.buildingsLabel")}
          value={`${buildings.length}`}
          sublabel={`${completed} ${t("stats.completed")}`}
          icon={<Castle className="size-4" />}
        />
        <StatCard
          label={t("stats.achievementsLabel")}
          value={`${unlockedCount}/${achievements.length}`}
          icon={<Trophy className="size-4" />}
        />
      </section>

      <KingdomGrid buildings={buildings} />

      <AddBuildingForm />

      {achievements.length > 0 && (
        <AchievementsPanel achievements={achievements} />
      )}
    </div>
  );
}
