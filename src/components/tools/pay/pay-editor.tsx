"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/shared/money-input";
import {
  type Subscription,
  type BillingCycle,
  BILLING_CYCLES,
  type NewSubscriptionInput,
} from "@/lib/storage/pay-store";
import { formatMoney } from "@/components/tools/pay/pay-format";

interface PayEditorProps {
  subscriptions: Subscription[];
  currency: string;
  localeTag: string;
  onAdd: (input: NewSubscriptionInput) => string;
  onUpdate: (id: string, patch: Partial<Omit<Subscription, "id">>) => void;
  onRemove: (id: string) => void;
  onRecordIncrease: (id: string, newAmount: number, effectiveMonth: string) => void;
}

const CATEGORIES = [
  "streaming",
  "music",
  "cloud",
  "software",
  "fitness",
  "shopping",
  "news",
  "gaming",
  "education",
  "other",
] as const;

function currentMonthString(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}

export function PayEditor({
  subscriptions,
  currency,
  localeTag,
  onAdd,
  onUpdate,
  onRemove,
  onRecordIncrease,
}: PayEditorProps) {
  const t = useTranslations("pay.editor");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [addName, setAddName] = useState("");
  const [addAmount, setAddAmount] = useState<number | null>(null);
  const [addCycle, setAddCycle] = useState<BillingCycle>("monthly");
  const [addCategory, setAddCategory] = useState("streaming");
  const [addDay, setAddDay] = useState(1);

  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState<number | null>(null);
  const [editCycle, setEditCycle] = useState<BillingCycle>("monthly");
  const [editCategory, setEditCategory] = useState("streaming");
  const [editDay, setEditDay] = useState(1);

  const [increaseId, setIncreaseId] = useState<string | null>(null);
  const [increaseAmount, setIncreaseAmount] = useState<number | null>(null);
  const [increaseMonth, setIncreaseMonth] = useState(currentMonthString());

  const activeSubs = subscriptions.filter((s) => s.active);
  const inactiveSubs = subscriptions.filter((s) => !s.active);

  function handleAdd() {
    if (!addName.trim() || !addAmount || addAmount <= 0) return;
    onAdd({
      name: addName.trim(),
      amount: addAmount,
      cycle: addCycle,
      category: addCategory,
      startDate: currentMonthString(),
      renewalDay: addDay,
      currency,
      active: true,
    });
    setAddName("");
    setAddAmount(null);
    setAddCycle("monthly");
    setAddCategory("streaming");
    setAddDay(1);
    setShowAdd(false);
  }

  function startEdit(sub: Subscription) {
    setEditingId(sub.id);
    setEditName(sub.name);
    setEditAmount(sub.amount);
    setEditCycle(sub.cycle);
    setEditCategory(sub.category);
    setEditDay(sub.renewalDay);
  }

  function saveEdit() {
    if (!editingId || !editName.trim() || !editAmount || editAmount <= 0) return;
    onUpdate(editingId, {
      name: editName.trim(),
      amount: editAmount,
      cycle: editCycle,
      category: editCategory,
      renewalDay: editDay,
    });
    setEditingId(null);
  }

  function handleRecordIncrease(sub: Subscription) {
    setIncreaseId(sub.id);
    setIncreaseAmount(sub.amount);
    setIncreaseMonth(currentMonthString());
  }

  function saveIncrease() {
    if (!increaseId || !increaseAmount || increaseAmount <= 0) return;
    onRecordIncrease(increaseId, increaseAmount, increaseMonth);
    setIncreaseId(null);
    setIncreaseAmount(null);
  }

  function renderSubRow(sub: Subscription, isInactive: boolean) {
    const isEditing = editingId === sub.id;
    const isRecordingIncrease = increaseId === sub.id;

    if (isEditing) {
      return (
        <div
          key={sub.id}
          className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3"
        >
          <div className="w-36">
            <label className="mb-1 block text-xs font-medium">{t("nameLabel")}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium">{t("amountLabel")}</label>
            <MoneyInput
              value={editAmount}
              onChange={setEditAmount}
              currency={currency}
              label={t("amountLabel")}
              hideLabel
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium">{t("cycleLabel")}</label>
            <select
              value={editCycle}
              onChange={(e) => setEditCycle(e.target.value as BillingCycle)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {BILLING_CYCLES.map((c) => (
                <option key={c} value={c}>
                  {t(`cycles.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="mb-1 block text-xs font-medium">{t("categoryLabel")}</label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label className="mb-1 block text-xs font-medium">{t("renewalDayLabel")}</label>
            <input
              type="number"
              min={1}
              max={28}
              value={editDay}
              onChange={(e) => setEditDay(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            />
          </div>
          <Button type="button" size="sm" onClick={saveEdit}>
            <Check className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditingId(null)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      );
    }

    if (isRecordingIncrease) {
      return (
        <div
          key={sub.id}
          className="flex flex-wrap items-end gap-2 rounded-lg border bg-amber-50 dark:bg-amber-500/10 p-3"
        >
          <p className="w-full text-sm font-medium">{t("recordIncreaseTitle", { name: sub.name })}</p>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium">{t("newAmountLabel")}</label>
            <MoneyInput
              value={increaseAmount}
              onChange={setIncreaseAmount}
              currency={currency}
              label={t("newAmountLabel")}
              hideLabel
            />
          </div>
          <div className="w-44">
            <label className="mb-1 block text-xs font-medium">{t("effectiveMonthLabel")}</label>
            <input
              type="month"
              value={increaseMonth}
              onChange={(e) => setIncreaseMonth(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            />
          </div>
          <Button type="button" size="sm" onClick={saveIncrease}>
            <Check className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIncreaseId(null)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      );
    }

    return (
      <div
        key={sub.id}
        className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${isInactive ? "opacity-50 line-through" : ""}`}
      >
        <div className="min-w-0 flex-1">
          <span className="font-medium">{sub.name}</span>
          <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
            {sub.category}
          </span>
        </div>
        <span className="text-sm tabular-nums">
          {formatMoney(sub.amount, localeTag, currency)}/{t(`cycles.${sub.cycle}`)}
        </span>
        <span className="text-xs text-muted-foreground">
          {t("renewsDay", { day: sub.renewalDay })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => startEdit(sub)}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRecordIncrease(sub)}
          >
            <span className="text-xs">↑</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm(t("deleteConfirm", { name: sub.name })))
                onRemove(sub.id);
            }}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        {!showAdd && (
          <Button type="button" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="size-4 mr-1" aria-hidden />
            {t("addButton")}
          </Button>
        )}
      </div>

      {showAdd && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
          <div className="w-36">
            <label className="mb-1 block text-xs font-medium">{t("nameLabel")}</label>
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium">{t("amountLabel")}</label>
            <MoneyInput
              value={addAmount}
              onChange={setAddAmount}
              currency={currency}
              label={t("amountLabel")}
              hideLabel
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium">{t("cycleLabel")}</label>
            <select
              value={addCycle}
              onChange={(e) => setAddCycle(e.target.value as BillingCycle)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {BILLING_CYCLES.map((c) => (
                <option key={c} value={c}>
                  {t(`cycles.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="mb-1 block text-xs font-medium">{t("categoryLabel")}</label>
            <select
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label className="mb-1 block text-xs font-medium">{t("renewalDayLabel")}</label>
            <input
              type="number"
              min={1}
              max={28}
              value={addDay}
              onChange={(e) => setAddDay(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            />
          </div>
          <Button type="button" size="sm" onClick={handleAdd}>
            <Check className="size-4" aria-hidden />
            {t("addConfirm")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdd(false)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyBody")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeSubs.map((sub) => renderSubRow(sub, false))}
          {inactiveSubs.map((sub) => renderSubRow(sub, true))}
        </div>
      )}
    </div>
  );
}
