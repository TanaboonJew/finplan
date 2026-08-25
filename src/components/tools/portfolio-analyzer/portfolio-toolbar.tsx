"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";
import { Button } from "@/components/ui/button";
import {
  PORTFOLIO_EXPORT_SCHEMA_VERSION,
  usePortfolioStore,
} from "@/lib/storage/portfolio-store";
import { createPortfolioDemoState } from "@/lib/demo/portfolio";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";

export function PortfolioToolbar() {
  const t = useTranslations("portfolio-analyzer.toolbar");
  const tShared = useTranslations("shared");

  function handleExport() {
    const state = usePortfolioStore.getState();
    const envelope = createExportEnvelope(
      "portfolio-analyzer",
      PORTFOLIO_EXPORT_SCHEMA_VERSION,
      {
        holdings: state.holdings,
        targets: state.targets,
      }
    );
    downloadJson(
      `finplan-portfolio-analyzer-${new Date().toISOString().slice(0, 10)}.json`,
      envelope
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, "portfolio-analyzer");
    if (envelope.schemaVersion !== PORTFOLIO_EXPORT_SCHEMA_VERSION) {
      throw new TypeError(
        `unsupported portfolio-analyzer schemaVersion ${envelope.schemaVersion}`
      );
    }
    usePortfolioStore.getState().replaceAll(envelope.data);
  }

  function handleImportError() {
    window.alert(t("importInvalid"));
  }

  function handleReset() {
    if (!window.confirm(t("resetConfirm"))) return;
    usePortfolioStore.getState().reset();
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <SeedDemoButton
        onSeed={() =>
          usePortfolioStore.getState().replaceAll(createPortfolioDemoState())
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
