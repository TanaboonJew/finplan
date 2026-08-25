"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { ExportImportButtons } from "@/components/shared/export-import-buttons";
import { SeedDemoButton } from "@/components/shared/seed-demo-button";
import { Button } from "@/components/ui/button";
import {
  CREDIT_CARD_EXPORT_SCHEMA_VERSION,
  useCreditCardStore,
} from "@/lib/storage/credit-card-store";
import { createCreditCardDemoState } from "@/lib/demo/credit-card";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";

export function CreditCardToolbar() {
  const t = useTranslations("credit-card.toolbar");
  const tShared = useTranslations("shared");

  function handleExport() {
    const state = useCreditCardStore.getState();
    const envelope = createExportEnvelope(
      "credit-card",
      CREDIT_CARD_EXPORT_SCHEMA_VERSION,
      {
        cards: state.cards,
        profiles: state.profiles,
        activeProfileIndex: state.activeProfileIndex,
      }
    );
    downloadJson(
      `finplan-credit-card-${new Date().toISOString().slice(0, 10)}.json`,
      envelope
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, "credit-card");
    if (envelope.schemaVersion !== CREDIT_CARD_EXPORT_SCHEMA_VERSION) {
      throw new TypeError(
        `unsupported credit-card schemaVersion ${envelope.schemaVersion}`
      );
    }
    useCreditCardStore.getState().replaceAll(envelope.data);
  }

  function handleImportError() {
    window.alert(t("importInvalid"));
  }

  function handleReset() {
    if (!window.confirm(t("resetConfirm"))) return;
    useCreditCardStore.getState().reset();
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <SeedDemoButton
        onSeed={() =>
          useCreditCardStore
            .getState()
            .replaceAll(createCreditCardDemoState())
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
