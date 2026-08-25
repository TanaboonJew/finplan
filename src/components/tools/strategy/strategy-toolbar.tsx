"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";
import { Button } from "@/components/ui/button";
import {
  STRATEGY_EXPORT_SCHEMA_VERSION,
  useStrategyStore,
} from "@/lib/storage/strategy-store";
import { createStrategyDemoState } from "@/lib/demo/strategy";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";

function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function StrategyToolbar({
  onExportMarkdown,
}: {
  onExportMarkdown: () => void;
}) {
  const t = useTranslations("strategy.toolbar");
  const tShared = useTranslations("shared");

  function handleExport() {
    const state = useStrategyStore.getState();
    const envelope = createExportEnvelope(
      "strategy",
      STRATEGY_EXPORT_SCHEMA_VERSION,
      { theses: state.theses }
    );
    downloadJson(
      `finplan-strategy-${new Date().toISOString().slice(0, 10)}.json`,
      envelope
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, "strategy");
    if (envelope.schemaVersion !== STRATEGY_EXPORT_SCHEMA_VERSION) {
      throw new TypeError(
        `unsupported strategy schemaVersion ${envelope.schemaVersion}`
      );
    }
    useStrategyStore.getState().replaceAll(envelope.data);
  }

  function handleImportError() {
    window.alert(t("importInvalid"));
  }

  function handleReset() {
    if (!window.confirm(t("resetConfirm"))) return;
    useStrategyStore.getState().reset();
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <SeedDemoButton
        onSeed={() =>
          useStrategyStore
            .getState()
            .replaceAll(createStrategyDemoState())
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
        variant="outline"
        size="sm"
        onClick={onExportMarkdown}
      >
        {t("exportMd")}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
        <RotateCcw className="size-4" aria-hidden />
        {t("reset")}
      </Button>
    </div>
  );
}

export { downloadMarkdown };
