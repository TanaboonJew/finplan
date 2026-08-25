"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FamilyMember } from "@/lib/finance/insurance";
import { FIELD_INPUT_CLASS, FIELD_LABEL_CLASS } from "./insurance-fields";

interface MembersEditorProps {
  members: FamilyMember[];
  onAdd: (member: Omit<FamilyMember, "id">) => void;
  onUpdate: (id: string, patch: Partial<Omit<FamilyMember, "id">>) => void;
  onRemove: (id: string) => void;
}

export function MembersEditor({
  members,
  onAdd,
  onUpdate,
  onRemove,
}: MembersEditorProps) {
  const t = useTranslations("insurance.members");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formRelationship, setFormRelationship] = useState("");

  function handleAdd() {
    const name = formName.trim();
    if (!name) return;
    onAdd({ name, relationship: formRelationship.trim() || "self" });
    setFormName("");
    setFormRelationship("");
  }

  function handleEdit(member: FamilyMember) {
    setEditingId(member.id);
    setFormName(member.name);
    setFormRelationship(member.relationship);
  }

  function handleSave() {
    if (!editingId || !formName.trim()) return;
    onUpdate(editingId, {
      name: formName.trim(),
      relationship: formRelationship.trim() || "self",
    });
    setEditingId(null);
    setFormName("");
    setFormRelationship("");
  }

  function handleCancel() {
    setEditingId(null);
    setFormName("");
    setFormRelationship("");
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      {members.length === 0 && editingId === null ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("emptyBody")}
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {members.map((member) =>
            editingId === member.id ? (
              <div
                key={member.id}
                className="rounded-md border border-border p-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className={FIELD_LABEL_CLASS}>{t("nameLabel")}</label>
                    <input
                      type="text"
                      className={FIELD_INPUT_CLASS}
                      value={formName}
                      placeholder={t("namePlaceholder")}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={FIELD_LABEL_CLASS}>
                      {t("relationshipLabel")}
                    </label>
                    <input
                      type="text"
                      className={FIELD_INPUT_CLASS}
                      value={formRelationship}
                      placeholder={t("relationshipPlaceholder")}
                      onChange={(e) => setFormRelationship(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button type="button" size="sm" onClick={handleSave}>
                    {t("save")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {member.relationship}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(member)}
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          t("deleteConfirm", { name: member.name })
                        )
                      ) {
                        onRemove(member.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            )
          )}
          {editingId === null && (
            <div className="rounded-md border border-border p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className={FIELD_LABEL_CLASS}>{t("nameLabel")}</label>
                  <input
                    type="text"
                    className={FIELD_INPUT_CLASS}
                    value={formName}
                    placeholder={t("namePlaceholder")}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={FIELD_LABEL_CLASS}>
                    {t("relationshipLabel")}
                  </label>
                  <input
                    type="text"
                    className={FIELD_INPUT_CLASS}
                    value={formRelationship}
                    placeholder={t("relationshipPlaceholder")}
                    onChange={(e) => setFormRelationship(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Button type="button" size="sm" onClick={handleAdd}>
                  <Plus className="size-4 mr-1" />
                  {t("add")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
