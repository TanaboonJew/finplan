"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TravelCardInput } from "@/lib/storage/travel-card-store";
import {
  fractionToPercentText,
  percentToFraction,
} from "@/components/tools/travel-card/travel-card-format";

interface CardCardProps {
  card: TravelCardInput;
  index: number;
  onRemove: (id: string) => void;
  canRemove: boolean;
  onUpdate: (id: string, patch: Partial<Omit<TravelCardInput, "id">>) => void;
  errors: Record<string, string | undefined>;
  t: ReturnType<typeof useTranslations<"travel-card.cards">>;
}

function CardCard({
  card,
  index,
  onRemove,
  canRemove,
  onUpdate,
  errors,
  t,
}: CardCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          {t("cardLabel")} {index + 1}
        </span>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(card.id)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      <div className="space-y-3">
        <div>
          <label
            htmlFor={`tc-name-${card.id}`}
            className="mb-1.5 block text-sm font-medium text-muted-foreground"
          >
            {t("nameLabel")}
          </label>
          <input
            id={`tc-name-${card.id}`}
            type="text"
            value={card.name}
            placeholder={t("namePlaceholder")}
            onChange={(e) => onUpdate(card.id, { name: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors[`card-${card.id}-name`] ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors[`card-${card.id}-name`]}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor={`tc-annual-${card.id}`}
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {t("annualFeeLabel")}
            </label>
            <input
              id={`tc-annual-${card.id}`}
              type="number"
              min={0}
              step={10}
              value={card.annualFee || ""}
              onChange={(e) =>
                onUpdate(card.id, { annualFee: Number(e.target.value) || 0 })
              }
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor={`tc-atm-${card.id}`}
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {t("atmFeeLabel")}
            </label>
            <input
              id={`tc-atm-${card.id}`}
              type="number"
              min={0}
              step={1}
              value={card.atmFeeFlat || ""}
              onChange={(e) =>
                onUpdate(card.id, { atmFeeFlat: Number(e.target.value) || 0 })
              }
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor={`tc-fxfee-${card.id}`}
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {t("fxFeeLabel")}
            </label>
            <div className="relative">
              <input
                id={`tc-fxfee-${card.id}`}
                type="text"
                value={fractionToPercentText(card.fxFeePercent)}
                onChange={(e) => {
                  const frac = percentToFraction(e.target.value);
                  if (frac !== null) onUpdate(card.id, { fxFeePercent: frac });
                }}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 pr-6 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <div>
            <label
              htmlFor={`tc-markup-${card.id}`}
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {t("fxMarkupLabel")}
            </label>
            <div className="relative">
              <input
                id={`tc-markup-${card.id}`}
                type="text"
                value={fractionToPercentText(card.fxMarkupPercent)}
                onChange={(e) => {
                  const frac = percentToFraction(e.target.value);
                  if (frac !== null)
                    onUpdate(card.id, { fxMarkupPercent: frac });
                }}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 pr-6 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <div>
            <label
              htmlFor={`tc-reward-foreign-${card.id}`}
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {t("rewardForeignLabel")}
            </label>
            <div className="relative">
              <input
                id={`tc-reward-foreign-${card.id}`}
                type="text"
                value={fractionToPercentText(card.rewardForeignPercent)}
                onChange={(e) => {
                  const frac = percentToFraction(e.target.value);
                  if (frac !== null)
                    onUpdate(card.id, { rewardForeignPercent: frac });
                }}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 pr-6 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <div>
            <label
              htmlFor={`tc-reward-domestic-${card.id}`}
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              {t("rewardDomesticLabel")}
            </label>
            <div className="relative">
              <input
                id={`tc-reward-domestic-${card.id}`}
                type="text"
                value={fractionToPercentText(card.rewardDomesticPercent)}
                onChange={(e) => {
                  const frac = percentToFraction(e.target.value);
                  if (frac !== null)
                    onUpdate(card.id, { rewardDomesticPercent: frac });
                }}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 pr-6 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface TravelCardCardsListProps {
  cards: TravelCardInput[];
  onAddCard: () => void;
  onUpdateCard: (id: string, patch: Partial<Omit<TravelCardInput, "id">>) => void;
  onRemoveCard: (id: string) => void;
  errors: Record<string, string | undefined>;
}

export function TravelCardCardsList({
  cards,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
  errors,
}: TravelCardCardsListProps) {
  const t = useTranslations("travel-card.cards");

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAddCard}>
          <Plus className="size-4" aria-hidden />
          {t("addCard")}
        </Button>
      </div>
      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("emptyBody")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((card, index) => (
            <CardCard
              key={card.id}
              card={card}
              index={index}
              onRemove={onRemoveCard}
              canRemove={cards.length > 1}
              onUpdate={onUpdateCard}
              errors={errors}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  );
}
