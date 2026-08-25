"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";
import { Button } from "@/components/ui/button";
import {
  INSURANCE_EXPORT_SCHEMA_VERSION,
  useInsuranceStore,
} from "@/lib/storage/insurance-store";
import { createInsuranceDemoState } from "@/lib/demo/insurance";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";

export function InsuranceToolbar() {
  const t = useTranslations("insurance.toolbar");
  const tShared = useTranslations("shared");

  function handleExport() {
    const state = useInsuranceStore.getState();
    const envelope = createExportEnvelope(
      "insurance",
      INSURANCE_EXPORT_SCHEMA_VERSION,
      {
        members: state.members,
        policies: state.policies,
      }
    );
    downloadJson(
      `finplan-insurance-${new Date().toISOString().slice(0, 10)}.json`,
      envelope
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, "insurance");
    if (envelope.schemaVersion !== INSURANCE_EXPORT_SCHEMA_VERSION) {
      throw new TypeError(
        `unsupported insurance schemaVersion ${envelope.schemaVersion}`
      );
    }
    useInsuranceStore.getState().replaceAll(envelope.data);
  }

  function handleImportError() {
    window.alert(t("importInvalid"));
  }

  function handleReset() {
    if (!window.confirm(t("resetConfirm"))) return;
    useInsuranceStore.getState().reset();
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <SeedDemoButton
        onSeed={() =>
          useInsuranceStore
            .getState()
            .replaceAll(createInsuranceDemoState())
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
