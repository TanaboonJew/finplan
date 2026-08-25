"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  goalNominalCost,
  goalProjectedSavings,
  goalShortfall,
} from "@/lib/finance/timeline";
import type { Goal } from "@/lib/storage/timeline-store";
import { GoalForm } from "@/components/tools/timeline/goal-form";
import {
  formatMoney,
  localeTagOf,
} from "@/components/tools/timeline/timeline-format";
import { useLocale } from "next-intl";

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  house: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  kids: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  retirement:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  education:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  custom: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
};

interface GoalsListProps {
  goals: Goal[];
  currentAge: number;
  currency: string;
  defaultReturnRate: number;
  defaultInflationRate: number;
  onAdd: (goal: Omit<Goal, "id">) => void;
  onUpdate: (id: string, patch: Partial<Goal>) => void;
  onRemove: (id: string) => void;
}

export function GoalsList({
  goals,
  currentAge,
  currency,
  defaultReturnRate,
  defaultInflationRate,
  onAdd,
  onUpdate,
  onRemove,
}: GoalsListProps) {
  const t = useTranslations("timeline.goals");
  const locale = useLocale();
  const localeTag = localeTagOf(locale);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handleSave(goal: Omit<Goal, "id">) {
    if (editingId !== null) {
      onUpdate(editingId, goal);
      setEditingId(null);
    } else {
      onAdd(goal);
      setShowForm(false);
    }
  }

  function handleCancel() {
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        {!showForm && editingId === null && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus className="size-4" aria-hidden />
            {t("add")}
          </Button>
        )}
      </header>

      {goals.length === 0 && !showForm && editingId === null && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("emptyMessage")}
          </p>
        </div>
      )}

      {showForm && editingId === null && (
        <div className="p-4">
          <GoalForm
            currency={currency}
            defaultReturnRate={defaultReturnRate}
            defaultInflationRate={defaultInflationRate}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}

      {goals.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className="px-4 py-2 font-medium">
                  {t("nameLabel")}
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  {t("categoryLabel")}
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  {t("ageRange", { start: "", end: "" }).replace(" – ", "").trim() || "Ages"}
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  {t("monthlySavingsLabel")}
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  {t("totalCostLabel")}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  {t("shortfallBadge")}
                </th>
                <th scope="col" className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => {
                const nominalCost = goalNominalCost(goal, currentAge);
                const projected = goalProjectedSavings(goal, currentAge);
                const shortfall = goalShortfall(projected, nominalCost);
                const hasShortfall = shortfall > 0;
                const badgeClass = CATEGORY_BADGE_CLASSES[goal.category] ?? CATEGORY_BADGE_CLASSES.custom;

                return editingId === goal.id ? (
                  <tr key={goal.id}>
                    <td colSpan={7} className="p-4">
                      <GoalForm
                        currency={currency}
                        defaultReturnRate={defaultReturnRate}
                        defaultInflationRate={defaultInflationRate}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        editGoal={goal}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={goal.id}
                    className="border-t border-border tabular-nums"
                  >
                    <td className="px-4 py-2.5 font-medium">{goal.name}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                      >
                        {t(`categories.${goal.category}`)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {goal.startAge} – {goal.endAge}
                    </td>
                    <td className="px-4 py-2.5">
                      {formatMoney(goal.monthlySavings, localeTag, currency)}
                      /mo
                    </td>
                    <td className="px-4 py-2.5">
                      <div>
                        {formatMoney(nominalCost, localeTag, currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("projectedSub", {
                          projected: formatMoney(projected, localeTag, currency),
                          cost: formatMoney(nominalCost, localeTag, currency),
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {hasShortfall ? (
                        <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300">
                          {t("shortfallBadge")}{" "}
                          {formatMoney(shortfall, localeTag, currency)}
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {t("surplusBadge")}{" "}
                          {formatMoney(
                            projected - nominalCost,
                            localeTag,
                            currency
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(goal.id)}
                          aria-label={t("edit")}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(t("deleteConfirm", { name: goal.name })))
                              onRemove(goal.id);
                          }}
                          aria-label={t("delete")}
                        >
                          <Trash2 className="size-3.5 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
