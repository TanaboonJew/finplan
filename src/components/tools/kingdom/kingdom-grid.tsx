"use client";

import { useTranslations } from "next-intl";
import { Castle } from "lucide-react";
import type { Building } from "@/lib/finance/kingdom";
import { BuildingCard } from "./building-card";

interface KingdomGridProps {
  buildings: Building[];
}

export function KingdomGrid({ buildings }: KingdomGridProps) {
  const t = useTranslations("kingdom.buildings");

  if (buildings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
        <Castle className="size-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          {t("emptyTitle")}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {t("emptyMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {buildings.map((building) => (
        <BuildingCard key={building.id} building={building} t={t} />
      ))}
    </div>
  );
}
