"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";
import { Button } from "@/components/ui/button";
import {
  WAKE_UP_EXPORT_SCHEMA_VERSION,
  useWakeUpStore,
} from "@/lib/storage/wake-up-store";
import { createWakeUpDemoState } from "@/lib/demo/wake-up";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";

export function WakeUpToolbar() {
  const t = useTranslations("wake-up.toolbar");
  const tShared = useTranslations("shared");

  function handleExport() {
    const state = useWakeUpStore.getState();
    const envelope = createExportEnvelope(
      "wake-up",
      WAKE_UP_EXPORT_SCHEMA_VERSION,
      {
        answers: state.answers,
        completedAt: state.completedAt,
      }
    );
    downloadJson(
      `finplan-wake-up-${new Date().toISOString().slice(0, 10)}.json`,
      envelope
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, "wake-up");
    if (envelope.schemaVersion !== WAKE_UP_EXPORT_SCHEMA_VERSION) {
      throw new TypeError(
        `unsupported wake-up schemaVersion ${envelope.schemaVersion}`
      );
    }
    useWakeUpStore.getState().replaceAll(envelope.data);
  }

  function handleImportError() {
    window.alert(t("importInvalid"));
  }

  function handleReset() {
    if (!window.confirm(t("resetConfirm"))) return;
    useWakeUpStore.getState().reset();
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <SeedDemoButton
        onSeed={() =>
          useWakeUpStore.getState().replaceAll(createWakeUpDemoState())
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
