"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ExportImportButtonsProps {
  onExport: () => void;
  onImport: (data: unknown) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

async function readFileText(file: File): Promise<string> {
  return file.text();
}

export function ExportImportButtons({
  onExport,
  onImport,
  onError,
  disabled = false,
  className,
}: ExportImportButtonsProps) {
  const t = useTranslations("shared");
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setImporting(true);
    try {
      const text = await readFileText(file);
      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch (cause) {
        throw new Error(t("importError"), { cause });
      }
      onImport(parsed);
    } catch (error) {
      const resolved =
        error instanceof Error ? error : new Error(t("importError"));
      if (onError) {
        onError(resolved);
      } else {
        window.alert(resolved.message);
      }
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onExport}
      >
        <Download className="size-4" aria-hidden />
        {t("export")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || importing}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" aria-hidden />
        {t("import")}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
