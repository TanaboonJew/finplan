"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EPSILON } from "@/lib/finance/constants";
import type { CategorySummary } from "@/lib/finance/budget";
import type { BudgetCategory } from "@/lib/storage/budget-store";
import {
  formatMonthShort,
  formatMoney,
} from "./budget-locale";
import { PlanCellInput } from "./plan-cell-input";

const MONTHS_PER_YEAR = 12;

export interface BudgetGridProps {
  categories: BudgetCategory[];
  summaries: Map<string, CategorySummary>;
  localeTag: string;
  onSetPlan: (
    categoryId: string,
    month: number,
    amount: number | null
  ) => void;
  onToggleRollover: (categoryId: string, enabled: boolean) => void;
  onRemoveCategory: (categoryId: string, name: string) => void;
}

const CELL_BASE =
  "border-b border-border/60 px-1.5 py-1.5 text-right align-top tabular-nums";

export function BudgetGrid({
  categories,
  summaries,
  localeTag,
  onSetPlan,
  onToggleRollover,
  onRemoveCategory,
}: BudgetGridProps) {
  const t = useTranslations("budget.grid");
  const tk = useTranslations("budget.kinds");
  const months = Array.from({ length: MONTHS_PER_YEAR }, (_, index) => index);

  const totals = months.map((month) => ({
    planned: categories.reduce(
      (sum, category) => sum + (summaries.get(category.id)?.planned[month] ?? 0),
      0
    ),
    actual: categories.reduce(
      (sum, category) => sum + (summaries.get(category.id)?.actual[month] ?? 0),
      0
    ),
  }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className={cn(
                "sticky left-0 z-10 min-w-[10rem] bg-card px-2 py-2 text-left",
                "text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              )}
            >
              {t("nameColumn")}
            </th>
            {months.map((month) => (
              <th
                key={month}
                scope="col"
                className="px-1.5 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {formatMonthShort(month, localeTag)}
              </th>
            ))}
            <th
              scope="col"
              className="px-1.5 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t("totalColumn")}
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              <span className="sr-only">{t("rolloverLabel")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const summary = summaries.get(category.id);
            if (!summary) return null;
            return (
              <tr key={category.id} className="group">
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 z-10 min-w-[10rem] max-w-[13rem] bg-card px-2 py-1.5",
                    "border-b border-border/60 text-left font-normal"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      title={tk(category.kind)}
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        category.kind === "savings"
                          ? "bg-emerald-500"
                          : "bg-zinc-400 dark:bg-zinc-600"
                      )}
                    />
                    <span className="truncate font-medium">{category.name}</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground tabular-nums">
                    {t("availableLabel")}:{" "}
                    {formatMoney(
                      summary.available[MONTHS_PER_YEAR - 1],
                      localeTag
                    )}
                  </span>
                </th>
                {months.map((month) => {
                  const planned = summary.planned[month];
                  const actual = summary.actual[month];
                  const available = summary.available[month];
                  const over =
                    available < -EPSILON &&
                    (summary.rolloverEnabled || actual > planned + EPSILON);
                  return (
                    <td key={month} className={CELL_BASE}>
                      <PlanCellInput
                        value={planned}
                        onCommit={(amount) =>
                          onSetPlan(category.id, month, amount)
                        }
                        label={`${category.name} · ${formatMonthShort(month, localeTag)} · ${t("legendPlan")}`}
                      />
                      <p
                        className={cn(
                          "mt-0.5 px-1 text-xs leading-4",
                          over
                            ? "font-medium text-red-600 dark:text-red-400"
                            : actual > 0
                              ? "text-foreground"
                              : "text-muted-foreground/50"
                        )}
                        title={`${t("legendActual")}: ${formatMoney(actual, localeTag)} · ${t("availableLabel")}: ${formatMoney(available, localeTag)}`}
                      >
                        {actual !== 0 ? formatMoney(actual, localeTag) : "—"}
                      </p>
                    </td>
                  );
                })}
                <td className={cn(CELL_BASE, "bg-muted/40")}>
                  <p className="text-xs font-semibold">
                    {formatMoney(summary.totalPlanned, localeTag)}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 px-1 text-xs leading-4",
                      summary.totalRemaining < -EPSILON
                        ? "font-medium text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatMoney(summary.totalActual, localeTag)}
                  </p>
                </td>
                <td className="whitespace-nowrap border-b border-border/60 px-2 py-1.5 text-right align-middle">
                  <label
                    className="inline-flex cursor-pointer items-center gap-1.5"
                    title={t("rolloverHint")}
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={category.rolloverEnabled}
                      onChange={(event) =>
                        onToggleRollover(category.id, event.target.checked)
                      }
                      aria-label={`${t("rolloverLabel")} – ${category.name}`}
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "relative h-4 w-7 shrink-0 rounded-full transition-colors",
                        "bg-muted-foreground/30 peer-checked:bg-emerald-600",
                        "peer-checked:[&>span]:translate-x-3",
                        "peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                      )}
                    >
                      <span className="absolute left-0.5 top-0.5 size-3 rounded-full bg-white shadow transition-transform" />
                    </span>
                    <span className="text-xs">{t("rolloverLabel")}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveCategory(category.id, category.name)}
                    className={cn(
                      "ml-2 inline-flex size-7 items-center justify-center rounded-md",
                      "text-muted-foreground transition-colors hover:bg-muted hover:text-red-600",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "dark:hover:text-red-400"
                    )}
                    aria-label={`${t("removeCategory")} – ${category.name}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th
              scope="row"
              className={cn(
                "sticky left-0 z-10 min-w-[10rem] bg-card px-2 py-2 text-left",
                "text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              )}
            >
              {t("totalColumn")}
            </th>
            {totals.map((total, month) => (
              <td key={month} className={cn(CELL_BASE, "font-semibold")}>
                <p>{formatMoney(total.planned, localeTag)}</p>
                <p
                  className={cn(
                    "text-xs",
                    total.actual > total.planned + EPSILON
                      ? "font-medium text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                  )}
                >
                  {formatMoney(total.actual, localeTag)}
                </p>
              </td>
            ))}
            <td className={cn(CELL_BASE, "bg-muted/60 font-semibold")}>
              <p>
                {formatMoney(
                  totals.reduce((sum, total) => sum + total.planned, 0),
                  localeTag
                )}
              </p>
              <p>
                {formatMoney(
                  totals.reduce((sum, total) => sum + total.actual, 0),
                  localeTag
                )}
              </p>
            </td>
            <td className="border-b border-border/60" aria-hidden />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
