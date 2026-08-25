"use client";

import { useTranslations } from "next-intl";
import { RotateCcw, Wand2 } from "lucide-react";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";
import { Button } from "@/components/ui/button";
import {
  STATEMENT_EXPORT_SCHEMA_VERSION,
  useStatementStore,
} from "@/lib/storage/statement-store";
import { createStatementDemoState } from "@/lib/demo/statement";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";

export function StatementToolbar() {
  const t = useTranslations("statement.toolbar");
  const tShared = useTranslations("shared");

  function handleExport() {
    const state = useStatementStore.getState();
    const envelope = createExportEnvelope(
      "statement",
      STATEMENT_EXPORT_SCHEMA_VERSION,
      {
        transactions: state.transactions,
        rules: state.rules,
      }
    );
    downloadJson(
      `finplan-statement-${new Date().toISOString().slice(0, 10)}.json`,
      envelope
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, "statement");
    if (envelope.schemaVersion !== STATEMENT_EXPORT_SCHEMA_VERSION) {
      throw new TypeError(
        `unsupported statement schemaVersion ${envelope.schemaVersion}`
      );
    }
    useStatementStore.getState().replaceAll(envelope.data);
  }

  function handleImportError() {
    window.alert(t("importInvalid"));
  }

  function handleReset() {
    if (!window.confirm(t("resetConfirm"))) return;
    useStatementStore.getState().reset();
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <SeedDemoButton
        onSeed={() =>
          useStatementStore.getState().replaceAll(createStatementDemoState())
        }
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

export function ApplyRulesButton() {
  const t = useTranslations("statement.rules");
  const count = useStatementStore((state) => state.transactions.length);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={count === 0}
      onClick={() => useStatementStore.getState().applyRulesToAll()}
    >
      <Wand2 className="size-4" aria-hidden />
      {t("apply")}
    </Button>
  );
}
