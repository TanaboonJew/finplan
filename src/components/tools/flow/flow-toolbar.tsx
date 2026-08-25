"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";

interface FlowToolbarProps {
  horizonMonths: number;
  currency: string;
  onHorizonChange: (value: number) => void;
  onCurrencyChange: (value: string) => void;
  onSeed: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (data: unknown) => void;
  onResetWhatIf: () => void;
}

export function FlowToolbar({
  horizonMonths,
  onHorizonChange,
  onSeed,
  onReset,
  onExport,
  onImport,
  onResetWhatIf,
}: FlowToolbarProps) {
  const t = useTranslations("flow");
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="flow-horizon"
          className="text-sm font-medium text-muted-foreground"
        >
          {t("toolbar.horizon")}
        </label>
        <div className="flex items-center gap-2">
          <input
            id="flow-horizon"
            type="range"
            min={1}
            max={120}
            value={horizonMonths}
            onChange={(e) => onHorizonChange(Number(e.target.value))}
            className="h-2 w-40 cursor-pointer accent-emerald-600"
          />
          <span className="min-w-[3ch] text-sm tabular-nums">{horizonMonths}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SeedDemoButton
          onSeed={onSeed}
          confirmMessage={t("toolbar.seedConfirm")}
        />
        <ExportImportButtons
          onExport={onExport}
          onImport={onImport}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetWhatIf}
        >
          {t("toolbar.resetWhatIf")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm(t("toolbar.resetConfirm"))) onReset();
          }}
        >
          <RotateCcw className="size-4" aria-hidden />
          {t("toolbar.reset")}
        </Button>
      </div>
    </div>
  );
}
