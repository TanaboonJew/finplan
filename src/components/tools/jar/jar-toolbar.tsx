"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";
import { Button } from "@/components/ui/button";
import {
  JAR_EXPORT_SCHEMA_VERSION,
  useJarStore,
  type JarToolPersisted,
} from "@/lib/storage/jar-store";
import { createJarDemoState } from "@/lib/demo/jar";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";

interface JarToolbarProps {
  slice: JarToolPersisted;
}

export function JarToolbar({ slice }: JarToolbarProps) {
  const t = useTranslations("jar.toolbar");
  const tShared = useTranslations("shared");

  function handleExport() {
    const envelope = createExportEnvelope(
      "jar",
      JAR_EXPORT_SCHEMA_VERSION,
      slice
    );
    downloadJson(
      `finplan-jar-${new Date().toISOString().slice(0, 10)}.json`,
      envelope
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, "jar");
    if (envelope.schemaVersion !== JAR_EXPORT_SCHEMA_VERSION) {
      throw new TypeError(`unsupported jar schemaVersion ${envelope.schemaVersion}`);
    }
    useJarStore.getState().replaceAll(envelope.data);
  }

  function handleImportError() {
    window.alert(t("importInvalid"));
  }

  function handleReset() {
    if (!window.confirm(t("resetConfirm"))) return;
    useJarStore.getState().reset();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SeedDemoButton
        onSeed={() =>
          useJarStore.getState().replaceAll(createJarDemoState())
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
