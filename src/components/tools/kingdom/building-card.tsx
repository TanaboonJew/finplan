"use client";

import { useTranslations } from "next-intl";
import { Castle, Church, Home, Tent, TowerControl, Landmark } from "lucide-react";
import type { Building, BuildingIcon } from "@/lib/finance/kingdom";
import { buildingProgress, buildingTier } from "@/lib/finance/kingdom";
import { useKingdomStore } from "@/lib/storage/kingdom-store";
import { Button } from "@/components/ui/button";
import { useMoney, FIELD_INPUT_CLASS, FIELD_LABEL_CLASS } from "./controls";
import { useState } from "react";

const ICON_MAP: Record<BuildingIcon, React.ComponentType<{ className?: string }>> = {
  castle: Castle,
  house: Home,
  tower: TowerControl,
  hut: Tent,
  temple: Church,
  bridge: Landmark,
};

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
};

const COLOR_TEXT_MAP: Record<string, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  blue: "text-blue-600 dark:text-blue-400",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  violet: "text-violet-600 dark:text-violet-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
};

const COLOR_BORDER_MAP: Record<string, string> = {
  emerald: "border-emerald-500",
  blue: "border-blue-500",
  amber: "border-amber-500",
  rose: "border-rose-500",
  violet: "border-violet-500",
  cyan: "border-cyan-500",
};

interface BuildingCardProps {
  building: Building;
  t: ReturnType<typeof useTranslations>;
}

export function BuildingCard({ building, t }: BuildingCardProps) {
  const money = useMoney();
  const progress = buildingProgress(building);
  const tier = buildingTier(progress);
  const remaining = building.targetAmount - building.currentAmount;
  const Icon = ICON_MAP[building.icon] ?? Castle;
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDate, setDepositDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [depositNote, setDepositNote] = useState("");

  const deposits = useKingdomStore((s) =>
    s.deposits.filter((d) => d.buildingId === building.id)
  );
  const recentDeposits = deposits.slice(0, 5);

  function handleDeposit() {
    const amount = parseFloat(depositAmount);
    if (!(amount > 0) || !Number.isFinite(amount)) return;
    useKingdomStore.getState().addDeposit({
      buildingId: building.id,
      amount,
      date: depositDate,
      note: depositNote,
    });
    setDepositAmount("");
    setDepositNote("");
    setShowDepositForm(false);
  }

  function handleRemoveDeposit(id: string) {
    useKingdomStore.getState().removeDeposit(id);
  }

  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 shadow-sm ${COLOR_BORDER_MAP[building.color] ?? "border-border"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-md ${COLOR_MAP[building.color] ?? "bg-muted"} text-white`}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{building.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">
            {t(`buildings.tiers.${tier.label}`)}
          </p>
        </div>
        <span className={`text-sm font-semibold tabular-nums ${COLOR_TEXT_MAP[building.color] ?? ""}`}>
          {Math.round(progress * 100)}%
        </span>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${COLOR_MAP[building.color] ?? "bg-primary"}`}
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{money.currency(building.currentAmount)}</span>
          <span>{money.currency(building.targetAmount)}</span>
        </div>
      </div>

      {remaining > 1e-9 && (
        <div className="mt-3">
          {!showDepositForm ? (
            <button
              type="button"
              onClick={() => setShowDepositForm(true)}
              className="w-full rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
            >
              {t("deposits.add")} — {money.currency(remaining)} {t("deposits.remaining")}
            </button>
          ) : (
            <div className="flex flex-col gap-2 rounded-md border border-border p-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={FIELD_LABEL_CLASS}>{t("deposits.amountLabel")}</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className={`${FIELD_INPUT_CLASS} mt-1`}
                  />
                </div>
                <div className="flex-1">
                  <label className={FIELD_LABEL_CLASS}>{t("deposits.dateLabel")}</label>
                  <input
                    type="date"
                    value={depositDate}
                    onChange={(e) => setDepositDate(e.target.value)}
                    className={`${FIELD_INPUT_CLASS} mt-1`}
                  />
                </div>
              </div>
              <input
                type="text"
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
                placeholder={t("deposits.notePlaceholder")}
                className={FIELD_INPUT_CLASS}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDeposit}
                  disabled={!(parseFloat(depositAmount) > 0)}
                >
                  {t("deposits.confirm")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDepositForm(false)}
                >
                  {t("deposits.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {recentDeposits.length > 0 && (
        <div className="mt-3 space-y-1">
          {recentDeposits.map((dep) => (
            <div
              key={dep.id}
              className="flex items-center justify-between text-xs text-muted-foreground"
            >
              <span>
                {dep.date} {dep.note ? `· ${dep.note}` : ""}
              </span>
              <div className="flex items-center gap-2">
                <span className="tabular-nums">{money.currency(dep.amount)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDeposit(dep.id)}
                  className="text-destructive hover:underline"
                  aria-label={t("deposits.remove")}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
