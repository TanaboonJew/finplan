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
import { TextField } from "@/components/tools/loan/text-field";

const CURRENCIES = ["USD", "EUR", "GBP", "THB", "SGD", "JPY"] as const;

export interface LoanToolbarProps {
  currency: string;
  startMonth: string;
  onCurrencyChange: (currency: string) => void;
  onStartMonthChange: (month: string) => void;
  onSeed: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (data: unknown) => void;
}

export function LoanToolbar({
  currency,
  startMonth,
  onCurrencyChange,
  onStartMonthChange,
  onSeed,
  onReset,
  onExport,
  onImport,
}: LoanToolbarProps) {
  const t = useTranslations("loan.toolbar");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-28">
        <label
          htmlFor="loan-currency"
          className="mb-1.5 block text-sm font-medium text-muted-foreground"
        >
          {t("currency")}
        </label>
        <select
          id="loan-currency"
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
      <TextField
        id="loan-start-month"
        label={t("startMonth")}
        type="month"
        value={startMonth}
        onChange={(event) => {
          const next = event.target.value;
          if (/^\d{4}-\d{2}$/.test(next)) onStartMonthChange(next);
        }}
        className="w-44"
      />
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
