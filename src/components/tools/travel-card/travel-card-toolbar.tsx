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

export interface TravelCardToolbarProps {
  onSeed: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (data: unknown) => void;
}

export function TravelCardToolbar({
  onSeed,
  onReset,
  onExport,
  onImport,
}: TravelCardToolbarProps) {
  const t = useTranslations("travel-card.toolbar");

  return (
    <div className="flex flex-wrap items-end gap-3">
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
