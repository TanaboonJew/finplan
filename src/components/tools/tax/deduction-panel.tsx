"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/shared/money-input";
import type { TaxDeduction } from "@/lib/storage/tax-store";
import { formatMoney } from "@/components/tools/tax/tax-format";

export interface DeductionPanelProps {
  deductions: TaxDeduction[];
  currency: string;
  localeTag: string;
  onToggle: (id: string) => void;
  onAmountChange: (id: string, amount: number) => void;
  onAdd: (name: string, amount: number) => void;
  onRemove: (id: string) => void;
}

function DeductionRow({
  deduction,
  currency,
  localeTag,
  onToggle,
  onAmountChange,
  onRemove,
  showRemove,
  removeLabel,
}: {
  deduction: TaxDeduction;
  currency: string;
  localeTag: string;
  onToggle: (id: string) => void;
  onAmountChange: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
  showRemove: boolean;
  removeLabel: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <button
        type="button"
        role="switch"
        aria-checked={deduction.enabled}
        onClick={() => onToggle(deduction.id)}
        className={`flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          deduction.enabled ? "bg-emerald-500" : "bg-muted"
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            deduction.enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <span
        className={`min-w-0 flex-1 text-sm ${
          deduction.enabled ? "" : "text-muted-foreground line-through"
        }`}
      >
        {deduction.name}
      </span>
      {deduction.enabled && editing ? (
        <MoneyInput
          label=""
          hideLabel
          value={deduction.amount}
          onChange={(val) => {
            if (val !== null && val >= 0) {
              onAmountChange(deduction.id, val);
            }
          }}
          currency={currency}
          className="w-32 shrink-0"
          onBlur={() => setEditing(false)}
          autoFocus
        />
      ) : deduction.enabled ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 cursor-pointer rounded px-1 py-0.5 tabular-nums text-sm font-medium hover:bg-muted"
        >
          {formatMoney(deduction.amount, localeTag, currency)}
        </button>
      ) : null}
      {showRemove ? (
        <button
          type="button"
          onClick={() => onRemove(deduction.id)}
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={removeLabel}
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

export function DeductionPanel({
  deductions,
  currency,
  localeTag,
  onToggle,
  onAmountChange,
  onAdd,
  onRemove,
}: DeductionPanelProps) {
  const t = useTranslations("tax.deductions");
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState<number | null>(null);

  function handleAdd() {
    if (newName.trim().length === 0 || newAmount === null || newAmount < 0)
      return;
    onAdd(newName.trim(), newAmount);
    setNewName("");
    setNewAmount(null);
  }

  const presetDeductions = deductions.filter(
    (d) => !d.id.startsWith("custom-")
  );
  const customDeductions = deductions.filter((d) =>
    d.id.startsWith("custom-")
  );

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t("title")}</h2>

      {presetDeductions.length > 0 ? (
        <div className="space-y-2">
          {presetDeductions.map((d) => (
            <DeductionRow
              key={d.id}
              deduction={d}
              currency={currency}
              localeTag={localeTag}
              onToggle={onToggle}
              onAmountChange={onAmountChange}
              onRemove={onRemove}
              showRemove={false}
              removeLabel={t("removeCustom")}
            />
          ))}
        </div>
      ) : null}

      {customDeductions.length > 0 ? (
        <div className="space-y-2">
          {customDeductions.map((d) => (
            <DeductionRow
              key={d.id}
              deduction={d}
              currency={currency}
              localeTag={localeTag}
              onToggle={onToggle}
              onAmountChange={onAmountChange}
              onRemove={onRemove}
              showRemove
              removeLabel={t("removeCustom")}
            />
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-3 rounded-lg border border-dashed border-border p-3">
        <div className="flex-1">
          <label
            htmlFor="deduction-name"
            className="mb-1.5 block text-sm font-medium text-muted-foreground"
          >
            {t("customNameLabel")}
          </label>
          <input
            id="deduction-name"
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder={t("customNamePlaceholder")}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <MoneyInput
          id="deduction-amount"
          label={t("amountLabel")}
          value={newAmount}
          onChange={setNewAmount}
          currency={currency}
          className="w-36"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={
            newName.trim().length === 0 ||
            newAmount === null ||
            newAmount < 0
          }
        >
          <Plus className="size-4" aria-hidden />
          {t("addCustom")}
        </Button>
      </div>
    </div>
  );
}
