"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ExportImportButtons,
} from "@/components/shared/export-import-buttons";
import {
  SeedDemoButton,
} from "@/components/shared/seed-demo-button";
import type { CountryPreset } from "@/lib/finance/tax-presets";

export interface TaxToolbarProps {
  country: CountryPreset;
  onCountryChange: (country: CountryPreset) => void;
  onSeed: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (data: unknown) => void;
}

const COUNTRIES: { value: CountryPreset; label: string }[] = [
  { value: "th", label: "Thailand (TH)" },
  { value: "us", label: "United States (US)" },
];

export function TaxToolbar({
  country,
  onCountryChange,
  onSeed,
  onReset,
  onExport,
  onImport,
}: TaxToolbarProps) {
  const t = useTranslations("tax.toolbar");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-44">
        <label
          htmlFor="tax-country"
          className="mb-1.5 block text-sm font-medium text-muted-foreground"
        >
          {t("country")}
        </label>
        <select
          id="tax-country"
          value={country}
          onChange={(event) =>
            onCountryChange(event.target.value as CountryPreset)
          }
          className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="ms-auto flex flex-wrap items-center gap-2">
        <SeedDemoButton onSeed={onSeed} confirmMessage={t("seedConfirm")} />
        <ExportImportButtons
          onExport={onExport}
          onImport={onImport}
        />
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
