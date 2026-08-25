"use client";

import { useTranslations } from "next-intl";
import { Trophy, Lock } from "lucide-react";
import type { Achievement, AchievementId } from "@/lib/finance/kingdom";

const ACHIEVEMENT_ICONS: Record<AchievementId, string> = {
  first_deposit: "💰",
  first_building: "🏗️",
  half_funded: "🌓",
  first_complete: "🎉",
  five_buildings: "🏘️",
  thousand_club: "💎",
  five_achievements: "⭐",
  kingdom_complete: "👑",
};

interface AchievementsPanelProps {
  achievements: Achievement[];
}

export function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  const t = useTranslations("kingdom.achievements");
  const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length;

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-amber-500" />
        <h2 className="font-semibold">{t("title")}</h2>
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {achievements.map((ach) => {
          const isUnlocked = ach.unlockedAt !== null;
          return (
            <div
              key={ach.id}
              className={`flex flex-col items-center gap-1 rounded-md border p-3 text-center transition-colors ${
                isUnlocked
                  ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                  : "border-border bg-muted/30 opacity-60"
              }`}
            >
              <div className="relative">
                <span className="text-2xl" role="img" aria-label={t(`names.${ach.id}`)}>
                  {ACHIEVEMENT_ICONS[ach.id]}
                </span>
                {!isUnlocked && (
                  <Lock className="absolute -right-1 -top-1 size-3 text-muted-foreground" />
                )}
              </div>
              <span className="text-xs font-medium leading-tight">
                {t(`names.${ach.id}`)}
              </span>
              {isUnlocked && ach.unlockedAt && (
                <span className="text-[10px] text-muted-foreground">
                  {new Date(ach.unlockedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
