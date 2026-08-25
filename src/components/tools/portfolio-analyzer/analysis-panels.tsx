"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import type {
  ClassDrift,
  ConcentrationWarning,
} from "@/lib/finance/portfolio";

export function WarningsList({
  warnings,
}: {
  warnings: readonly ConcentrationWarning[];
}) {
  const t = useTranslations("portfolio-analyzer.warnings");

  if (warnings.length === 0) return null;

  return (
    <section
      aria-label={t("title")}
      className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
        <AlertTriangle className="size-4" aria-hidden />
        {t("title")}
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {warnings.map((warning) => (
          <li
            key={warning.kind === "position" ? warning.id : warning.assetClass}
            className="text-sm text-amber-900 dark:text-amber-200"
          >
            {warning.kind === "position"
              ? t("positionOver", {
                  symbol: warning.symbol,
                  percent: formatWeight(warning.weight),
                })
              : t("classOver", {
                  assetClass: warning.assetClass,
                  percent: formatWeight(warning.weight),
                })}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DriftTable({ rows }: { rows: readonly ClassDrift[] }) {
  const t = useTranslations("portfolio-analyzer.drift");

  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <caption className="sr-only">{t("title")}</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="px-4 py-2 font-medium">{t("class")}</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">{t("actual")}</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">{t("target")}</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">{t("delta")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.assetClass} className="border-b border-border last:border-b-0">
              <td className="px-4 py-2 font-medium">{row.assetClass}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatWeight(row.actual)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatWeight(row.target)}
              </td>
              <td
                className={`px-4 py-2 text-right tabular-nums ${
                  row.delta > 0.001
                    ? "font-medium text-emerald-600 dark:text-emerald-400"
                    : row.delta < -0.001
                      ? "font-medium text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                }`}
              >
                {row.delta >= 0 ? "+" : ""}
                {formatWeight(row.delta)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatWeight(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
