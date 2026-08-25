"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Castle,
  Church,
  Home,
  Tent,
  TowerControl,
  Landmark,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BuildingColor, BuildingIcon } from "@/lib/finance/kingdom";
import { BUILDING_COLORS } from "@/lib/finance/kingdom";
import { useKingdomStore } from "@/lib/storage/kingdom-store";
import { FIELD_INPUT_CLASS, FIELD_LABEL_CLASS } from "./controls";

const ICON_OPTIONS: { icon: BuildingIcon; Component: React.ComponentType<{ className?: string }> }[] = [
  { icon: "castle", Component: Castle },
  { icon: "house", Component: Home },
  { icon: "tower", Component: TowerControl },
  { icon: "hut", Component: Tent },
  { icon: "temple", Component: Church },
  { icon: "bridge", Component: Landmark },
];

const COLOR_SWATCHES: Record<BuildingColor, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
};

export function AddBuildingForm() {
  const t = useTranslations("kingdom.buildings");
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<BuildingIcon>("castle");
  const [color, setColor] = useState<BuildingColor>("emerald");
  const [targetAmount, setTargetAmount] = useState("");

  const buildingCount = useKingdomStore((s) => s.buildings.length);
  const maxReached = buildingCount >= 12;

  function handleSubmit() {
    const amount = parseFloat(targetAmount);
    if (!(amount > 0) || !Number.isFinite(amount)) return;
    if (!name.trim()) return;
    useKingdomStore.getState().addBuilding({
      name: name.trim(),
      icon,
      targetAmount: amount,
      color,
    });
    setName("");
    setTargetAmount("");
    setIsOpen(false);
  }

  if (maxReached) return null;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card p-6 text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
      >
        <Plus className="size-5" />
        {t("addTitle")}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t("addTitle")}</h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <div>
          <label className={FIELD_LABEL_CLASS}>{t("nameLabel")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            className={`${FIELD_INPUT_CLASS} mt-1`}
            autoFocus
          />
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>{t("targetLabel")}</label>
          <input
            type="number"
            min="1"
            step="1"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="0.00"
            className={`${FIELD_INPUT_CLASS} mt-1`}
          />
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>{t("iconLabel")}</label>
          <div className="mt-1 flex gap-2">
            {ICON_OPTIONS.map((opt) => (
              <button
                key={opt.icon}
                type="button"
                onClick={() => setIcon(opt.icon)}
                className={`flex size-9 items-center justify-center rounded-md border transition-colors ${
                  icon === opt.icon
                    ? "border-foreground bg-muted text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/20"
                }`}
                aria-label={t(`iconNames.${opt.icon}`)}
              >
                <opt.Component className="size-4" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>{t("colorLabel")}</label>
          <div className="mt-1 flex gap-2">
            {BUILDING_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`size-7 rounded-full transition-transform ${COLOR_SWATCHES[c]} ${
                  color === c ? "scale-125 ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                }`}
                aria-label={t(`colorNames.${c}`)}
              />
            ))}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!name.trim() || !(parseFloat(targetAmount) > 0)}
        >
          <Plus className="size-4" aria-hidden />
          {t("addButton")}
        </Button>
      </div>
    </div>
  );
}
