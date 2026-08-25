"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";

const CURRENCIES = ["USD", "EUR", "GBP", "THB", "SGD", "JPY"] as const;

export interface TimelineToolbarProps {
  currency: string;
  onCurrencyChange: (currency: string) => void;
  onSeed: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (data: unknown) => void;
}

export function TimelineToolbar({
  currency,
  onCurrencyChange,
  onSeed,
  onReset,
  onExport,
  onImport,
}: TimelineToolbarProps) {
  const t = useTranslations("timeline.toolbar");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-28">
        <label
          htmlFor="timeline-currency"
          className="mb-1.5 block text-sm font-medium text-muted-foreground"
        >
          {t("currency")}
        </label>
        <select
          id="timeline-currency"
          value={currency}
          onChange={(event) => onCurrencyChange(event.target.value)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      <div className="ms-auto flex flex-wrap items-center gap-2">
        <SeedDemoButton onSeed={onSeed} confirmMessage={t("seedConfirm")} />
        <ExportImportButtons onExport={onExport} onImport={onImport} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm(t("resetConfirm"))) onReset();
          }}
        >
          <RotateCcw className="size-4" aria-hidden />
          {t("reset")}
        </Button>
      </div>
    </div>
  );
}
