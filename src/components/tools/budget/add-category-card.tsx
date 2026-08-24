"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isCategoryKind, type CategoryKind } from "@/lib/finance/budget";
import {
  FIELD_INPUT_CLASS,
  FIELD_LABEL_CLASS,
} from "./budget-fields";

export interface AddCategoryCardProps {
  onAdd: (name: string, kind: CategoryKind) => void;
}

export function AddCategoryCard({ onAdd }: AddCategoryCardProps) {
  const t = useTranslations("budget.grid.addCategory");
  const tk = useTranslations("budget.kinds");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>("expense");

  const trimmed = name.trim();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (trimmed.length === 0) return;
    onAdd(trimmed, kind);
    setName("");
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="budget-new-name" className={FIELD_LABEL_CLASS}>
          {t("nameLabel")}
        </label>
        <input
          id="budget-new-name"
          type="text"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={FIELD_INPUT_CLASS}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="budget-new-kind" className={FIELD_LABEL_CLASS}>
          {t("kindLabel")}
        </label>
        <select
          id="budget-new-kind"
          className={FIELD_INPUT_CLASS}
          value={kind}
          onChange={(event) => {
            const next = event.target.value;
            if (isCategoryKind(next)) setKind(next);
          }}
        >
          <option value="expense">{tk("expense")}</option>
          <option value="savings">{tk("savings")}</option>
        </select>
      </div>
      <div>
        <Button
          type="submit"
          size="sm"
          className="w-full sm:w-auto"
          disabled={trimmed.length === 0}
        >
          <Plus className="size-4" aria-hidden />
          {t("addButton")}
        </Button>
      </div>
    </form>
  );
}
