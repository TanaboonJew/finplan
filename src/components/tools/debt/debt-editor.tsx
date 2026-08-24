"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/shared/money-input";
import { formatApr, formatMoney } from "@/components/tools/debt/debt-format";
import { PercentInput } from "@/components/tools/debt/percent-input";
import { TextField } from "@/components/tools/debt/text-field";
import type { DebtInput, NewDebtInput } from "@/lib/storage/debt-store";

interface DebtDraft {
  name: string;
  balance: number | null;
  annualRate: number | null;
  minimumPayment: number | null;
}

type DebtErrors = Partial<Record<keyof DebtDraft, string>>;

type ValidationMessages = {
  nameRequired: string;
  nonNegative: string;
  rateRange: string;
};

const EMPTY_DRAFT: DebtDraft = {
  name: "",
  balance: null,
  annualRate: null,
  minimumPayment: null,
};

export interface DebtEditorProps {
  debts: readonly DebtInput[];
  currency: string;
  localeTag: string;
  onAdd: (input: NewDebtInput) => void;
  onUpdate: (id: string, patch: Partial<Omit<DebtInput, "id">>) => void;
  onRemove: (id: string) => void;
}

function validateDraft(
  draft: DebtDraft,
  messages: ValidationMessages
): DebtErrors {
  const errors: DebtErrors = {};
  if (draft.name.trim().length === 0) {
    errors.name = messages.nameRequired;
  }
  if (
    draft.balance === null ||
    !Number.isFinite(draft.balance) ||
    draft.balance < 0
  ) {
    errors.balance = messages.nonNegative;
  }
  const rate = draft.annualRate ?? 0;
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    errors.annualRate = messages.rateRange;
  }
  const minimum = draft.minimumPayment ?? 0;
  if (!Number.isFinite(minimum) || minimum < 0) {
    errors.minimumPayment = messages.nonNegative;
  }
  return errors;
}

function ErrorList({ errors }: { errors: DebtErrors }) {
  const messages = Object.values(errors);
  if (messages.length === 0) return null;
  return (
    <div role="alert" className="mt-2 space-y-0.5">
      {messages.map((message, index) => (
        <p
          key={`${index}-${message}`}
          className="text-xs text-red-600 dark:text-red-400"
        >
          {message}
        </p>
      ))}
    </div>
  );
}

interface DraftFieldsProps {
  draft: DebtDraft;
  currency: string;
  nameLabel: string;
  balanceLabel: string;
  aprLabel: string;
  minimumLabel: string;
  namePlaceholder?: string;
  onChange: (patch: Partial<DebtDraft>) => void;
}

function DraftFields({
  draft,
  currency,
  nameLabel,
  balanceLabel,
  aprLabel,
  minimumLabel,
  namePlaceholder,
  onChange,
}: DraftFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <TextField
        label={nameLabel}
        placeholder={namePlaceholder}
        value={draft.name}
        maxLength={60}
        onChange={(event) => onChange({ name: event.target.value })}
      />
      <MoneyInput
        label={balanceLabel}
        currency={currency}
        value={draft.balance}
        onChange={(value) => onChange({ balance: value })}
      />
      <PercentInput
        label={aprLabel}
        value={draft.annualRate}
        placeholder="18.99"
        onChange={(value) => onChange({ annualRate: value })}
      />
      <MoneyInput
        label={minimumLabel}
        currency={currency}
        value={draft.minimumPayment}
        onChange={(value) => onChange({ minimumPayment: value })}
      />
    </div>
  );
}

export function DebtEditor({
  debts,
  currency,
  localeTag,
  onAdd,
  onUpdate,
  onRemove,
}: DebtEditorProps) {
  const t = useTranslations("debt.editor");
  const tv = useTranslations("debt.validation");
  const [draft, setDraft] = useState<DebtDraft>(EMPTY_DRAFT);
  const [attempted, setAttempted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const errors = validateDraft(draft, {
    nameRequired: tv("nameRequired"),
    nonNegative: tv("nonNegative"),
    rateRange: tv("rateRange"),
  });
  const isValid = Object.keys(errors).length === 0;

  function submit() {
    setAttempted(true);
    if (!isValid) return;
    onAdd({
      name: draft.name.trim(),
      balance: draft.balance ?? 0,
      annualRate: draft.annualRate ?? 0,
      minimumPayment: draft.minimumPayment ?? 0,
    });
    setDraft(EMPTY_DRAFT);
    setAttempted(false);
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <ListChecks className="size-4 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold">{t("title")}</h3>
      </header>

      {debts.length === 0 ? (
        <div className="mb-4 rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            {t("emptyBody")}
          </p>
        </div>
      ) : (
        <ul className="mb-2 space-y-2" data-slot="debt-list">
          {debts.map((debt) =>
            editingId === debt.id ? null : (
              <li
                key={debt.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md border border-border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{debt.name}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatApr(debt.annualRate)} APR ·{" "}
                    {formatMoney(debt.minimumPayment, localeTag, currency)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="me-2 text-sm font-semibold tabular-nums">
                    {formatMoney(debt.balance, localeTag, currency)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("edit")}
                    onClick={() => setEditingId(debt.id)}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("delete")}
                    onClick={() => {
                      if (
                        window.confirm(
                          t("deleteConfirm", { name: debt.name })
                        )
                      ) {
                        onRemove(debt.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {editingId !== null ? (
        <EditingRow
          debt={debts.find((d) => d.id === editingId) ?? null}
          currency={currency}
          onCancel={() => setEditingId(null)}
          onSave={(patch) => {
            onUpdate(editingId, patch);
            setEditingId(null);
          }}
        />
      ) : null}

      <form
        className="mt-3 rounded-md border border-dashed border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        noValidate
      >
        <h4 className="sr-only">{t("addTitle")}</h4>
        <DraftFields
          draft={draft}
          currency={currency}
          nameLabel={t("nameLabel")}
          balanceLabel={t("balanceLabel")}
          aprLabel={t("aprLabel")}
          minimumLabel={t("minimumLabel")}
          namePlaceholder={t("namePlaceholder")}
          onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        />
        {attempted ? <ErrorList errors={errors} /> : null}
        <div className="mt-3 flex items-center gap-2">
          <Button type="submit" size="sm" disabled={attempted && !isValid}>
            <Plus className="size-4" aria-hidden />
            {t("add")}
          </Button>
        </div>
      </form>
    </section>
  );
}

interface EditingRowProps {
  debt: DebtInput | null;
  currency: string;
  onCancel: () => void;
  onSave: (patch: Omit<NewDebtInput, "id">) => void;
}

function EditingRow({ debt, currency, onCancel, onSave }: EditingRowProps) {
  const t = useTranslations("debt.editor");
  const tv = useTranslations("debt.validation");
  const [draft, setDraft] = useState<DebtDraft>(
    debt
      ? {
          name: debt.name,
          balance: debt.balance,
          annualRate: debt.annualRate,
          minimumPayment: debt.minimumPayment,
        }
      : EMPTY_DRAFT
  );

  if (debt === null) return null;

  const errors = validateDraft(draft, {
    nameRequired: tv("nameRequired"),
    nonNegative: tv("nonNegative"),
    rateRange: tv("rateRange"),
  });
  const valid = Object.keys(errors).length === 0;

  return (
    <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
      <DraftFields
        draft={draft}
        currency={currency}
        nameLabel={t("nameLabel")}
        balanceLabel={t("balanceLabel")}
        aprLabel={t("aprLabel")}
        minimumLabel={t("minimumLabel")}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
      />
      <ErrorList errors={errors} />
      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!valid}
          onClick={() =>
            onSave({
              name: draft.name.trim(),
              balance: draft.balance ?? 0,
              annualRate: draft.annualRate ?? 0,
              minimumPayment: draft.minimumPayment ?? 0,
            })
          }
        >
          {t("save")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
