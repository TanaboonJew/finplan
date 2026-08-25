"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CreditCardInput, RewardType } from "@/lib/finance/credit-card";
import {
  FIELD_INPUT_CLASS,
  FIELD_LABEL_CLASS,
  SELECT_INPUT_CLASS,
} from "./credit-card-fields";

interface CardsEditorProps {
  cards: CreditCardInput[];
  onAdd: (card: Omit<CreditCardInput, "id">) => void;
  onUpdate: (id: string, patch: Partial<Omit<CreditCardInput, "id">>) => void;
  onRemove: (id: string) => void;
}

const EMPTY_CARD: Omit<CreditCardInput, "id"> = {
  name: "",
  network: "",
  annualFee: 0,
  foreignFee: 0,
  apr: 0,
  rewardType: "cashback" as RewardType,
  rewardRates: [{ categoryId: "all", rate: 0 }],
  signupBonus: 0,
  pointValue: 1,
  notes: "",
};

const NETWORKS = ["Visa", "Mastercard", "Amex", "Discover", "Other"];

export function CardsEditor({
  cards,
  onAdd,
  onUpdate,
  onRemove,
}: CardsEditorProps) {
  const t = useTranslations("credit-card.editor");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CreditCardInput, "id">>(EMPTY_CARD);

  function handleAdd() {
    if (!form.name.trim()) return;
    onAdd({ ...form, name: form.name.trim() });
    setForm(EMPTY_CARD);
  }

  function handleEdit(card: CreditCardInput) {
    setEditingId(card.id);
    setForm({
      name: card.name,
      network: card.network,
      annualFee: card.annualFee,
      foreignFee: card.foreignFee,
      apr: card.apr,
      rewardType: card.rewardType,
      rewardRates: card.rewardRates.map((r) => ({ ...r })),
      signupBonus: card.signupBonus,
      pointValue: card.pointValue,
      notes: card.notes,
    });
  }

  function handleSave() {
    if (!editingId || !form.name.trim()) return;
    onUpdate(editingId, { ...form, name: form.name.trim() });
    setEditingId(null);
    setForm(EMPTY_CARD);
  }

  function handleCancel() {
    setEditingId(null);
    setForm(EMPTY_CARD);
  }

  function handleRateChange(index: number, field: "categoryId" | "rate", value: string) {
    setForm((prev) => ({
      ...prev,
      rewardRates: prev.rewardRates.map((r, i) =>
        i === index
          ? { ...r, [field]: field === "rate" ? Number(value) || 0 : value }
          : r
      ),
    }));
  }

  function addRate() {
    setForm((prev) => ({
      ...prev,
      rewardRates: [...prev.rewardRates, { categoryId: "", rate: 0 }],
    }));
  }

  function removeRate(index: number) {
    setForm((prev) => ({
      ...prev,
      rewardRates: prev.rewardRates.filter((_, i) => i !== index),
    }));
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      {cards.length === 0 && editingId === null ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("emptyBody")}
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {cards.map((card) =>
            editingId === card.id ? (
              <CardForm
                key={card.id}
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onCancel={handleCancel}
                onRateChange={handleRateChange}
                onAddRate={addRate}
                onRemoveRate={removeRate}
                isEditing
                t={t}
              />
            ) : (
              <CardRow
                key={card.id}
                card={card}
                onEdit={() => handleEdit(card)}
                onRemove={() => {
                  if (window.confirm(t("deleteConfirm", { name: card.name }))) {
                    onRemove(card.id);
                  }
                }}
                t={t}
              />
            )
          )}
          <CardForm
            form={form}
            setForm={setForm}
            onSave={handleAdd}
            onCancel={handleCancel}
            onRateChange={handleRateChange}
            onAddRate={addRate}
            onRemoveRate={removeRate}
            isEditing={false}
            t={t}
          />
        </div>
      )}
    </section>
  );
}

function CardRow({
  card,
  onEdit,
  onRemove,
  t,
}: {
  card: CreditCardInput;
  onEdit: () => void;
  onRemove: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const flatRate = card.rewardRates.find((r) => r.categoryId === "all");
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{card.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {card.network} · {t("fee")}: ${card.annualFee}
          {flatRate ? ` · ${(flatRate.rate * 100).toFixed(1)}% flat` : ""}
          {card.rewardType !== "cashback"
            ? ` · ${card.rewardType}`
            : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          {t("edit")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 dark:text-red-400"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface CardFormProps {
  form: Omit<CreditCardInput, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<CreditCardInput, "id">>>;
  onSave: () => void;
  onCancel: () => void;
  onRateChange: (index: number, field: "categoryId" | "rate", value: string) => void;
  onAddRate: () => void;
  onRemoveRate: (index: number) => void;
  isEditing: boolean;
  t: ReturnType<typeof useTranslations>;
}

function CardForm({
  form,
  setForm,
  onSave,
  onCancel,
  onRateChange,
  onAddRate,
  onRemoveRate,
  isEditing,
  t,
}: CardFormProps) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label={t("nameLabel")}
          value={form.name}
          onChange={(v) => setForm((prev) => ({ ...prev, name: v }))}
          placeholder={t("namePlaceholder")}
        />
        <div className="flex flex-col gap-1">
          <label className={FIELD_LABEL_CLASS}>{t("networkLabel")}</label>
          <select
            className={SELECT_INPUT_CLASS}
            value={form.network}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, network: e.target.value }))
            }
          >
            <option value="">{t("networkPlaceholder")}</option>
            {NETWORKS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <Field
          label={t("annualFeeLabel")}
          type="number"
          value={String(form.annualFee)}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, annualFee: Number(v) || 0 }))
          }
        />
        <Field
          label={t("aprLabel")}
          type="number"
          step="0.01"
          value={String((form.apr * 100).toFixed(2))}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, apr: (Number(v) || 0) / 100 }))
          }
        />
        <Field
          label={t("foreignFeeLabel")}
          type="number"
          step="0.01"
          value={String((form.foreignFee * 100).toFixed(2))}
          onChange={(v) =>
            setForm((prev) => ({
              ...prev,
              foreignFee: (Number(v) || 0) / 100,
            }))
          }
        />
        <div className="flex flex-col gap-1">
          <label className={FIELD_LABEL_CLASS}>{t("rewardTypeLabel")}</label>
          <select
            className={SELECT_INPUT_CLASS}
            value={form.rewardType}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                rewardType: e.target.value as RewardType,
              }))
            }
          >
            <option value="cashback">{t("rewardTypes.cashback")}</option>
            <option value="points">{t("rewardTypes.points")}</option>
            <option value="miles">{t("rewardTypes.miles")}</option>
          </select>
        </div>
        {form.rewardType !== "cashback" && (
          <Field
            label={t("pointValueLabel")}
            type="number"
            step="0.01"
            value={String(form.pointValue)}
            onChange={(v) =>
              setForm((prev) => ({ ...prev, pointValue: Number(v) || 1 }))
            }
          />
        )}
        <Field
          label={t("signupBonusLabel")}
          type="number"
          value={String(form.signupBonus)}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, signupBonus: Number(v) || 0 }))
          }
        />
      </div>

      <div className="mt-3">
        <label className={FIELD_LABEL_CLASS}>{t("rewardRatesLabel")}</label>
        <div className="mt-1 flex flex-col gap-2">
          {form.rewardRates.map((rate, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                className={`${FIELD_INPUT_CLASS} w-32`}
                placeholder={t("rateCategoryPlaceholder")}
                value={rate.categoryId}
                onChange={(e) => onRateChange(i, "categoryId", e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                className={`${FIELD_INPUT_CLASS} w-24`}
                value={(rate.rate * 100).toFixed(2)}
                onChange={(e) => onRateChange(i, "rate", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">%</span>
              {form.rewardRates.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveRate(i)}
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={onAddRate}>
            <Plus className="size-3 mr-1" /> {t("addRate")}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" onClick={onSave}>
          {isEditing ? t("save") : t("add")}
        </Button>
        {isEditing && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className={FIELD_LABEL_CLASS}>{label}</label>
      <input
        type={type}
        step={step}
        className={FIELD_INPUT_CLASS}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
