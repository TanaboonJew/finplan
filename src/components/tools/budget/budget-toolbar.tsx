"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";
import { Button } from "@/components/ui/button";
import {
  BUDGET_EXPORT_SCHEMA_VERSION,
  useBudgetStore,
  type BudgetToolPersisted,
} from "@/lib/storage/budget-store";
import { createBudgetDemoState } from "@/lib/demo/budget";
import { FIELD_INPUT_CLASS, FIELD_LABEL_CLASS } from "./budget-fields";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";

const YEAR_RANGE = 5;

interface BudgetToolbarProps {
  slice: Pick<BudgetToolPersisted, "year">;
}

export function BudgetToolbar({ slice }: BudgetToolbarProps) {
  const t = useTranslations("budget.toolbar");
  const ty = useTranslations("budget.year");
  const tShared = useTranslations("shared");

  const thisYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = thisYear - YEAR_RANGE; year <= thisYear + YEAR_RANGE; year += 1) {
    years.push(year);
  }

  function handleExport() {
    const state = useBudgetStore.getState();
    const envelope = createExportEnvelope(
      "budget",
      BUDGET_EXPORT_SCHEMA_VERSION,
      {
        year: state.year,
        categories: state.categories,
        entries: state.entries,
      }
    );
    downloadJson(
      `finplan-budget-${new Date().toISOString().slice(0, 10)}.json`,
      envelope
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, "budget");
    if (envelope.schemaVersion !== BUDGET_EXPORT_SCHEMA_VERSION) {
      throw new TypeError(
        `unsupported budget schemaVersion ${envelope.schemaVersion}`
      );
    }
    useBudgetStore.getState().replaceAll(envelope.data);
  }

  function handleImportError() {
    window.alert(t("importInvalid"));
  }

  function handleReset() {
    if (!window.confirm(t("resetConfirm"))) return;
    useBudgetStore.getState().reset();
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="budget-year" className={FIELD_LABEL_CLASS}>
          {ty("label")}
        </label>
        <select
          id="budget-year"
          className={`${FIELD_INPUT_CLASS} w-24`}
          value={slice.year}
          onChange={(event) =>
            useBudgetStore.getState().setYear(Number(event.target.value))
          }
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <SeedDemoButton
        onSeed={() => useBudgetStore.getState().replaceAll(createBudgetDemoState())}
        confirmMessage={tShared("seedConfirm")}
      />
      <ExportImportButtons
        onExport={handleExport}
        onImport={handleImport}
        onError={handleImportError}
      />
      <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
        <RotateCcw className="size-4" aria-hidden />
        {t("reset")}
      </Button>
    </div>
  );
}
