"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  InsurancePolicy,
  PolicyType,
  CoverageFrequency,
  FamilyMember,
} from "@/lib/finance/insurance";
import { ALL_POLICY_TYPES } from "@/lib/finance/insurance";
import {
  FIELD_INPUT_CLASS,
  FIELD_LABEL_CLASS,
  SELECT_INPUT_CLASS,
} from "./insurance-fields";

interface PoliciesEditorProps {
  policies: InsurancePolicy[];
  members: FamilyMember[];
  onAdd: (policy: Omit<InsurancePolicy, "id">) => void;
  onUpdate: (
    id: string,
    patch: Partial<Omit<InsurancePolicy, "id">>
  ) => void;
  onRemove: (id: string) => void;
}

const EMPTY_POLICY: Omit<InsurancePolicy, "id"> = {
  name: "",
  type: "life" as PolicyType,
  provider: "",
  policyNumber: "",
  premiumAmount: 0,
  premiumFrequency: "monthly" as CoverageFrequency,
  sumInsured: 0,
  deductible: 0,
  startDate: "",
  endDate: "",
  memberIds: [],
  notes: "",
};

export function PoliciesEditor({
  policies,
  members,
  onAdd,
  onUpdate,
  onRemove,
}: PoliciesEditorProps) {
  const t = useTranslations("insurance.policies");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<InsurancePolicy, "id">>(EMPTY_POLICY);

  function handleAdd() {
    if (!form.name.trim()) return;
    onAdd({ ...form, name: form.name.trim() });
    setForm(EMPTY_POLICY);
  }

  function handleEdit(policy: InsurancePolicy) {
    setEditingId(policy.id);
    setForm({
      name: policy.name,
      type: policy.type,
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      premiumAmount: policy.premiumAmount,
      premiumFrequency: policy.premiumFrequency,
      sumInsured: policy.sumInsured,
      deductible: policy.deductible,
      startDate: policy.startDate,
      endDate: policy.endDate,
      memberIds: [...policy.memberIds],
      notes: policy.notes,
    });
  }

  function handleSave() {
    if (!editingId || !form.name.trim()) return;
    onUpdate(editingId, { ...form, name: form.name.trim() });
    setEditingId(null);
    setForm(EMPTY_POLICY);
  }

  function handleCancel() {
    setEditingId(null);
    setForm(EMPTY_POLICY);
  }

  function toggleMemberId(memberId: string) {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter((id) => id !== memberId)
        : [...prev.memberIds, memberId],
    }));
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      {policies.length === 0 && editingId === null ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("emptyBody")}
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {policies.map((policy) =>
            editingId === policy.id ? (
              <PolicyForm
                key={policy.id}
                form={form}
                setForm={setForm}
                members={members}
                onSave={handleSave}
                onCancel={handleCancel}
                onToggleMember={toggleMemberId}
                isEditing
                t={t}
              />
            ) : (
              <PolicyRow
                key={policy.id}
                policy={policy}
                members={members}
                onEdit={() => handleEdit(policy)}
                onRemove={() => {
                  if (
                    window.confirm(
                      t("deleteConfirm", { name: policy.name })
                    )
                  ) {
                    onRemove(policy.id);
                  }
                }}
                t={t}
              />
            )
          )}
          {editingId === null && (
            <PolicyForm
              form={form}
              setForm={setForm}
              members={members}
              onSave={handleAdd}
              onCancel={handleCancel}
              onToggleMember={toggleMemberId}
              isEditing={false}
              t={t}
            />
          )}
        </div>
      )}
    </section>
  );
}

function PolicyRow({
  policy,
  members,
  onEdit,
  onRemove,
  t,
}: {
  policy: InsurancePolicy;
  members: FamilyMember[];
  onEdit: () => void;
  onRemove: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const assignedNames = policy.memberIds
    .map((id) => members.find((m) => m.id === id)?.name ?? "?")
    .join(", ");

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{policy.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("types." + policy.type)} · {policy.provider}
          {policy.premiumAmount > 0
            ? ` · ${policy.premiumAmount}/${policy.premiumFrequency}`
            : ""}
        </p>
        {assignedNames && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {assignedNames}
          </p>
        )}
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

interface PolicyFormProps {
  form: Omit<InsurancePolicy, "id">;
  setForm: React.Dispatch<
    React.SetStateAction<Omit<InsurancePolicy, "id">>
  >;
  members: FamilyMember[];
  onSave: () => void;
  onCancel: () => void;
  onToggleMember: (memberId: string) => void;
  isEditing: boolean;
  t: ReturnType<typeof useTranslations>;
}

function PolicyForm({
  form,
  setForm,
  members,
  onSave,
  onCancel,
  onToggleMember,
  isEditing,
  t,
}: PolicyFormProps) {
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
          <label className={FIELD_LABEL_CLASS}>{t("typeLabel")}</label>
          <select
            className={SELECT_INPUT_CLASS}
            value={form.type}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                type: e.target.value as PolicyType,
              }))
            }
          >
            {ALL_POLICY_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {t("types." + pt)}
              </option>
            ))}
          </select>
        </div>
        <Field
          label={t("providerLabel")}
          value={form.provider}
          onChange={(v) => setForm((prev) => ({ ...prev, provider: v }))}
          placeholder={t("providerPlaceholder")}
        />
        <Field
          label={t("policyNumberLabel")}
          value={form.policyNumber}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, policyNumber: v }))
          }
          placeholder={t("policyNumberPlaceholder")}
        />
        <Field
          label={t("premiumLabel")}
          type="number"
          value={String(form.premiumAmount)}
          onChange={(v) =>
            setForm((prev) => ({
              ...prev,
              premiumAmount: Number(v) || 0,
            }))
          }
        />
        <div className="flex flex-col gap-1">
          <label className={FIELD_LABEL_CLASS}>
            {t("frequencyLabel")}
          </label>
          <select
            className={SELECT_INPUT_CLASS}
            value={form.premiumFrequency}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                premiumFrequency: e.target.value as CoverageFrequency,
              }))
            }
          >
            <option value="monthly">{t("frequencies.monthly")}</option>
            <option value="annual">{t("frequencies.annual")}</option>
            <option value="one-time">{t("frequencies.one-time")}</option>
          </select>
        </div>
        <Field
          label={t("sumInsuredLabel")}
          type="number"
          value={String(form.sumInsured)}
          onChange={(v) =>
            setForm((prev) => ({
              ...prev,
              sumInsured: Number(v) || 0,
            }))
          }
        />
        <Field
          label={t("deductibleLabel")}
          type="number"
          value={String(form.deductible)}
          onChange={(v) =>
            setForm((prev) => ({
              ...prev,
              deductible: Number(v) || 0,
            }))
          }
        />
        <Field
          label={t("startDateLabel")}
          type="date"
          value={form.startDate}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, startDate: v }))
          }
        />
        <Field
          label={t("endDateLabel")}
          type="date"
          value={form.endDate}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, endDate: v }))
          }
        />
      </div>

      {members.length > 0 && (
        <div className="mt-3">
          <label className={FIELD_LABEL_CLASS}>{t("membersLabel")}</label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("membersHint")}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {members.map((member) => (
              <label
                key={member.id}
                className="flex items-center gap-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.memberIds.includes(member.id)}
                  onChange={() => onToggleMember(member.id)}
                  className="size-4 rounded border-input"
                />
                {member.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1">
        <label className={FIELD_LABEL_CLASS}>{t("notesLabel")}</label>
        <textarea
          className="min-h-[48px] w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={form.notes}
          placeholder={t("notesPlaceholder")}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, notes: e.target.value }))
          }
        />
      </div>

      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" onClick={onSave}>
          {isEditing ? t("save") : t("add")}
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
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
