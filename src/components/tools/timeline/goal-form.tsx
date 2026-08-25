"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/shared/money-input";
import type { Goal, GoalCategory } from "@/lib/storage/timeline-store";

const MAX_AGE = 120;

const inputClasses =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function FieldShell({
  id,
  label,
  suffix,
  children,
}: {
  id: string;
  label: React.ReactNode;
  suffix?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        {children}
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function FormTextField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <FieldShell id={id} label={label}>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClasses}
      />
    </FieldShell>
  );
}

function FormNumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = MAX_AGE,
}: {
  id: string;
  label: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <FieldShell id={id} label={label}>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
        className={`${inputClasses} tabular-nums`}
      />
    </FieldShell>
  );
}

function FormPercentField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <FieldShell id={id} label={label} suffix="%">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={String(Number((value * 100).toPrecision(12)))}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[\s,'%\u00A0]/g, "");
          if (cleaned.length === 0) return;
          const parsed = Number(cleaned);
          if (Number.isFinite(parsed)) onChange(parsed / 100);
        }}
        className={`${inputClasses} pr-7 tabular-nums`}
      />
    </FieldShell>
  );
}

const CATEGORY_OPTIONS: readonly { value: GoalCategory; labelKey: string }[] = [
  { value: "house", labelKey: "categories.house" },
  { value: "kids", labelKey: "categories.kids" },
  { value: "retirement", labelKey: "categories.retirement" },
  { value: "education", labelKey: "categories.education" },
  { value: "custom", labelKey: "categories.custom" },
];

interface GoalFormProps {
  currency: string;
  defaultReturnRate: number;
  defaultInflationRate: number;
  onSave: (goal: Omit<Goal, "id">) => void;
  onCancel: () => void;
  editGoal?: Goal;
}

export function GoalForm({
  currency,
  defaultReturnRate,
  defaultInflationRate,
  onSave,
  onCancel,
  editGoal,
}: GoalFormProps) {
  const t = useTranslations("timeline.goals");
  const formId = useId();

  const [name, setName] = useState(editGoal?.name ?? "");
  const [category, setCategory] = useState<GoalCategory>(
    editGoal?.category ?? "custom"
  );
  const [startAge, setStartAge] = useState(editGoal?.startAge ?? 30);
  const [endAge, setEndAge] = useState(editGoal?.endAge ?? 35);
  const [totalCost, setTotalCost] = useState(editGoal?.totalCost ?? 0);
  const [monthlySavings, setMonthlySavings] = useState(
    editGoal?.monthlySavings ?? 0
  );
  const [annualReturnRate, setAnnualReturnRate] = useState(
    editGoal?.annualReturnRate ?? defaultReturnRate
  );
  const [inflationRate, setInflationRate] = useState(
    editGoal?.inflationRate ?? defaultInflationRate
  );

  function handleSave() {
    onSave({
      name: name.trim() || "Untitled goal",
      category,
      startAge,
      endAge,
      totalCost,
      monthlySavings,
      annualReturnRate,
      inflationRate,
    });
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          {editGoal ? t("edit") : t("add")}
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t("cancel")}
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
        <FormTextField
          id={`${formId}-name`}
          label={t("nameLabel")}
          value={name}
          onChange={setName}
          placeholder={t("namePlaceholder")}
        />
        <div className="flex w-full flex-col gap-1.5">
          <label
            htmlFor={`${formId}-category`}
            className="text-sm font-medium text-muted-foreground"
          >
            {t("categoryLabel")}
          </label>
          <select
            id={`${formId}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value as GoalCategory)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <FormNumberField
          id={`${formId}-start`}
          label={t("startAgeLabel")}
          value={startAge}
          onChange={setStartAge}
        />
        <FormNumberField
          id={`${formId}-end`}
          label={t("endAgeLabel")}
          value={endAge}
          onChange={setEndAge}
        />
        <MoneyInput
          label={t("totalCostLabel")}
          currency={currency}
          value={totalCost}
          onChange={(v) => setTotalCost(v ?? 0)}
        />
        <MoneyInput
          label={t("monthlySavingsLabel")}
          currency={currency}
          value={monthlySavings}
          onChange={(v) => setMonthlySavings(v ?? 0)}
        />
        <FormPercentField
          id={`${formId}-return`}
          label={t("returnLabel")}
          value={annualReturnRate}
          onChange={setAnnualReturnRate}
        />
        <FormPercentField
          id={`${formId}-inflation`}
          label={t("inflationLabel")}
          value={inflationRate}
          onChange={setInflationRate}
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="button" size="sm" onClick={handleSave}>
          <Plus className="size-4" aria-hidden />
          {editGoal ? t("save") : t("add")}
        </Button>
      </div>
    </div>
  );
}
