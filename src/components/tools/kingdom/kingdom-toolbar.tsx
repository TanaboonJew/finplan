"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";
import { Button } from "@/components/ui/button";
import {
  KINGDOM_EXPORT_SCHEMA_VERSION,
  useKingdomStore,
  type KingdomToolPersisted,
} from "@/lib/storage/kingdom-store";
import { createKingdomDemoState } from "@/lib/demo/kingdom";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";

interface KingdomToolbarProps {
  slice: KingdomToolPersisted;
}

export function KingdomToolbar({ slice }: KingdomToolbarProps) {
  const t = useTranslations("kingdom.toolbar");
  const tShared = useTranslations("shared");

  function handleExport() {
    const envelope = createExportEnvelope(
      "kingdom",
      KINGDOM_EXPORT_SCHEMA_VERSION,
      slice
    );
    downloadJson(
      `finplan-kingdom-${new Date().toISOString().slice(0, 10)}.json`,
      envelope
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, "kingdom");
    if (envelope.schemaVersion !== KINGDOM_EXPORT_SCHEMA_VERSION) {
      throw new TypeError(
        `unsupported kingdom schemaVersion ${envelope.schemaVersion}`
      );
    }
    useKingdomStore.getState().replaceAll(envelope.data);
  }

  function handleImportError() {
    window.alert(t("importInvalid"));
  }

  function handleReset() {
    if (!window.confirm(t("resetConfirm"))) return;
    useKingdomStore.getState().reset();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SeedDemoButton
        onSeed={() =>
          useKingdomStore.getState().replaceAll(createKingdomDemoState())
        }
        confirmMessage={tShared("seedConfirm")}
      />
      <ExportImportButtons
        onExport={handleExport}
        onImport={handleImport}
        onError={handleImportError}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleReset}
      >
        <RotateCcw className="size-4" aria-hidden />
        {t("reset")}
      </Button>
    </div>
  );
}
