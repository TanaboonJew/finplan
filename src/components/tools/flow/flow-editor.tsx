"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/shared/money-input";
import type { FlowStream } from "@/lib/finance/flow";

const inputClasses =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface FlowEditorProps {
  streams: FlowStream[];
  currency: string;
  startMonth: string;
  onAdd: (stream: Omit<FlowStream, "id">) => string;
  onUpdate: (id: string, patch: Partial<Omit<FlowStream, "id">>) => void;
  onRemove: (id: string) => void;
}

function StreamRow({
  stream,
  currency,
  onUpdate,
  onRemove,
}: {
  stream: FlowStream;
  currency: string;
  onUpdate: (id: string, patch: Partial<Omit<FlowStream, "id">>) => void;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("flow");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stream.name);
  const [amount, setAmount] = useState<number | null>(stream.amount);
  const [startMonth, setStartMonth] = useState(stream.startMonth);
  const [endMonth, setEndMonth] = useState(stream.endMonth ?? "");

  function save() {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) return;
    if (amount === null || amount < 0) return;
    if (startMonth.length === 0) return;
    if (endMonth.length > 0 && endMonth < startMonth) return;
    onUpdate(stream.id, {
      name: trimmedName,
      amount,
      startMonth,
      endMonth: endMonth.length > 0 ? endMonth : null,
    });
    setEditing(false);
  }

  function cancel() {
    setName(stream.name);
    setAmount(stream.amount);
    setStartMonth(stream.startMonth);
    setEndMonth(stream.endMonth ?? "");
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-muted/30 p-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("editor.nameLabel")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            className={inputClasses + " w-32"}
          />
        </div>
        <MoneyInput
          value={amount}
          onChange={setAmount}
          label={t("editor.amountLabel")}
          currency={currency}
          className="w-28"
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("editor.startLabel")}
          </label>
          <input
            type="month"
            value={startMonth}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setStartMonth(e.target.value)
            }
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("editor.endLabel")}
          </label>
          <input
            type="month"
            value={endMonth}
            placeholder={t("editor.endPlaceholder")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEndMonth(e.target.value)
            }
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          />
        </div>
        <Button type="button" size="sm" onClick={save} className="h-8">
          <Check className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={cancel}
          className="h-8"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/10 px-3 py-2">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">{stream.name}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {stream.amount.toLocaleString("en-US", { minimumFractionDigits: 0 })} / mo
        </span>
        <span className="text-xs text-muted-foreground">
          {stream.startMonth}
          {stream.endMonth ? ` – ${stream.endMonth}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setEditing(true)}
          className="h-7 w-7 p-0"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            if (window.confirm(t("editor.deleteConfirm", { name: stream.name }))) {
              onRemove(stream.id);
            }
          }}
          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AddStreamForm({
  category,
  startMonth,
  currency,
  onAdd,
}: {
  category: "income" | "expense";
  startMonth: string;
  currency: string;
  onAdd: (stream: Omit<FlowStream, "id">) => string;
}) {
  const t = useTranslations("flow");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [start, setStart] = useState(startMonth);
  const [end, setEnd] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0 || amount === null || amount < 0 || start.length === 0) {
      return;
    }
    onAdd({
      name: trimmed,
      amount,
      category,
      startMonth: start,
      endMonth: end.length > 0 ? end : null,
    });
    setName("");
    setAmount(null);
    setStart(startMonth);
    setEnd("");
  }

  const addLabel =
    category === "income" ? t("editor.addIncome") : t("editor.addExpense");
  const namePlaceholder =
    category === "income" ? "e.g. Salary" : "e.g. Rent";

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("editor.nameLabel")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder={namePlaceholder}
          className={inputClasses + " w-32"}
        />
      </div>
      <MoneyInput
        value={amount}
        onChange={setAmount}
        label={t("editor.amountLabel")}
        currency={currency}
        className="w-28"
      />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("editor.startLabel")}
        </label>
        <input
          type="month"
          value={start}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setStart(e.target.value)
          }
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("editor.endLabel")}
        </label>
        <input
          type="month"
          value={end}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEnd(e.target.value)
          }
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        />
      </div>
      <Button type="submit" size="sm" className="h-8">
        <Plus className="size-3.5" aria-hidden />
        {addLabel}
      </Button>
    </form>
  );
}

export function FlowEditor({
  streams,
  currency,
  startMonth,
  onAdd,
  onUpdate,
  onRemove,
}: FlowEditorProps) {
  const t = useTranslations("flow");

  const incomeStreams = streams.filter((s) => s.category === "income");
  const expenseStreams = streams.filter((s) => s.category === "expense");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("editor.incomeTitle")}</h2>
        {incomeStreams.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="font-medium">{t("editor.emptyIncome")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("editor.emptyIncomeBody")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {incomeStreams.map((s) => (
              <StreamRow
                key={s.id}
                stream={s}
                currency={currency}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
        <AddStreamForm
          category="income"
          startMonth={startMonth}
          currency={currency}
          onAdd={onAdd}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("editor.expenseTitle")}</h2>
        {expenseStreams.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="font-medium">{t("editor.emptyExpense")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("editor.emptyExpenseBody")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenseStreams.map((s) => (
              <StreamRow
                key={s.id}
                stream={s}
                currency={currency}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
        <AddStreamForm
          category="expense"
          startMonth={startMonth}
          currency={currency}
          onAdd={onAdd}
        />
      </section>
    </div>
  );
}
