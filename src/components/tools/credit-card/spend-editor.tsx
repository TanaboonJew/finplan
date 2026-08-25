"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SpendCategory } from "@/lib/finance/credit-card";
import type { SpendProfile } from "@/lib/storage/credit-card-store";
import { FIELD_INPUT_CLASS } from "./credit-card-fields";

interface SpendEditorProps {
  profiles: SpendProfile[];
  activeProfileIndex: number;
  onAddProfile: (name: string) => void;
  onUpdateProfile: (
    index: number,
    patch: Partial<Pick<SpendProfile, "name" | "categories">>
  ) => void;
  onRemoveProfile: (index: number) => void;
  onSetActiveProfileIndex: (index: number) => void;
}

export function SpendEditor({
  profiles,
  activeProfileIndex,
  onAddProfile,
  onUpdateProfile,
  onRemoveProfile,
  onSetActiveProfileIndex,
}: SpendEditorProps) {
  const t = useTranslations("credit-card.spend");
  const [newProfileName, setNewProfileName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatSpend, setNewCatSpend] = useState("");

  const activeProfile = profiles[activeProfileIndex];

  function handleAddProfile() {
    if (!newProfileName.trim()) return;
    onAddProfile(newProfileName.trim());
    setNewProfileName("");
  }

  function handleAddCategory() {
    if (!activeProfile || !newCatName.trim()) return;
    const cat: SpendCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      annualSpend: Number(newCatSpend) || 0,
    };
    onUpdateProfile(activeProfileIndex, {
      categories: [...activeProfile.categories, cat],
    });
    setNewCatName("");
    setNewCatSpend("");
  }

  function handleUpdateCategory(catId: string, annualSpend: number) {
    if (!activeProfile) return;
    onUpdateProfile(activeProfileIndex, {
      categories: activeProfile.categories.map((c) =>
        c.id === catId ? { ...c, annualSpend: Math.max(0, annualSpend) } : c
      ),
    });
  }

  function handleRemoveCategory(catId: string) {
    if (!activeProfile) return;
    onUpdateProfile(activeProfileIndex, {
      categories: activeProfile.categories.filter((c) => c.id !== catId),
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{t("title")}</h3>

      {profiles.length === 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t("noProfiles")}</p>
          <div className="flex gap-2">
            <input
              type="text"
              className={FIELD_INPUT_CLASS}
              placeholder={t("profileNamePlaceholder")}
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
            />
            <Button type="button" size="sm" onClick={handleAddProfile}>
              {t("addProfile")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {profiles.map((profile, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSetActiveProfileIndex(i)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  i === activeProfileIndex
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {profile.name}
              </button>
            ))}
            <div className="flex gap-1">
              <input
                type="text"
                className={`${FIELD_INPUT_CLASS} w-28`}
                placeholder={t("newProfilePlaceholder")}
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
              />
              <Button type="button" variant="ghost" size="sm" onClick={handleAddProfile}>
                <Plus className="size-3" />
              </Button>
            </div>
          </div>

          {activeProfile && (
            <div className="mt-3">
              <div className="mb-2 flex items-center gap-2">
                <input
                  type="text"
                  className={`${FIELD_INPUT_CLASS} w-48`}
                  value={activeProfile.name}
                  onChange={(e) =>
                    onUpdateProfile(activeProfileIndex, { name: e.target.value })
                  }
                />
                {profiles.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                    onClick={() => {
                      if (window.confirm(t("deleteProfileConfirm"))) {
                        onRemoveProfile(activeProfileIndex);
                      }
                    }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>

              {activeProfile.categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("noCategories")}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeProfile.categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <span className="min-w-[120px] truncate text-sm">{cat.name}</span>
                      <input
                        type="number"
                        className={`${FIELD_INPUT_CLASS} w-28`}
                        value={cat.annualSpend || ""}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateCategory(cat.id, Number(e.target.value) || 0)
                        }
                      />
                      <span className="text-xs text-muted-foreground">/yr</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCategory(cat.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  className={`${FIELD_INPUT_CLASS} w-32`}
                  placeholder={t("categoryNamePlaceholder")}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <input
                  type="number"
                  className={`${FIELD_INPUT_CLASS} w-24`}
                  placeholder="0"
                  value={newCatSpend}
                  onChange={(e) => setNewCatSpend(e.target.value)}
                />
                <Button type="button" variant="ghost" size="sm" onClick={handleAddCategory}>
                  <Plus className="size-3 mr-1" /> {t("addCategory")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
