"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { compareCards, totalSpend } from "@/lib/finance/credit-card";
import { useCreditCardStore } from "@/lib/storage/credit-card-store";
import { useMounted } from "./use-mounted";
import { CreditCardToolbar } from "./credit-card-toolbar";
import { CreditCardStats } from "./credit-card-stats";
import { CardsEditor } from "./cards-editor";
import { SpendEditor } from "./spend-editor";
import { RankingTable } from "./ranking-table";

export function CreditCardTool() {
  const t = useTranslations("credit-card");
  const mounted = useMounted();

  const cards = useCreditCardStore((state) => state.cards);
  const profiles = useCreditCardStore((state) => state.profiles);
  const activeProfileIndex = useCreditCardStore(
    (state) => state.activeProfileIndex
  );

  const activeCategories = useMemo(() => {
    const profile = profiles[activeProfileIndex];
    return profile ? profile.categories : [];
  }, [profiles, activeProfileIndex]);

  const results = useMemo(
    () => compareCards(cards, activeCategories),
    [cards, activeCategories]
  );

  const spend = useMemo(() => totalSpend(activeCategories), [activeCategories]);

  if (!mounted) {
    return (
      <div
        className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10"
        aria-busy="true"
      >
        <span className="sr-only">{t("loading")}</span>
        <div className="flex animate-pulse flex-col gap-6">
          <div className="h-9 w-64 rounded-md bg-muted" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
          </div>
          <div className="h-48 rounded-lg bg-muted" />
          <div className="h-72 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <CreditCardToolbar />
      </header>

      <CreditCardStats results={results} totalSpend={spend} />

      <SpendEditor
        profiles={profiles}
        activeProfileIndex={activeProfileIndex}
        onAddProfile={(name) =>
          useCreditCardStore.getState().addProfile(name)
        }
        onUpdateProfile={(index, patch) =>
          useCreditCardStore.getState().updateProfile(index, patch)
        }
        onRemoveProfile={(index) =>
          useCreditCardStore.getState().removeProfile(index)
        }
        onSetActiveProfileIndex={(index) =>
          useCreditCardStore.getState().setActiveProfileIndex(index)
        }
      />

      <CardsEditor
        cards={cards}
        onAdd={(card) => useCreditCardStore.getState().addCard(card)}
        onUpdate={(id, patch) =>
          useCreditCardStore.getState().updateCard(id, patch)
        }
        onRemove={(id) => useCreditCardStore.getState().removeCard(id)}
      />

      <RankingTable results={results} />
    </div>
  );
}
