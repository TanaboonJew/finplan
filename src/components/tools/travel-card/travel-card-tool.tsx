"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createExportEnvelope,
  downloadJson,
  readExportEnvelope,
} from "@/lib/storage/json";
import {
  TRAVEL_CARD_TOOL_ID,
  TRAVEL_CARD_SCHEMA_VERSION,
  createDefaultCard,
  sanitizeTravelCardToolPersisted,
  useTravelCardStore,
  type TravelCardToolPersisted,
  type TravelCardInput,
} from "@/lib/storage/travel-card-store";
import { compareTravelCards } from "@/lib/finance/travel-card";
import { createTravelCardDemoState } from "@/lib/demo/travel-card";
import { TravelCardToolbar } from "@/components/tools/travel-card/travel-card-toolbar";
import { TravelCardCardsList } from "@/components/tools/travel-card/travel-card-cards-list";
import { TravelTripInputs } from "@/components/tools/travel-card/travel-card-trip-inputs";
import { TravelCardResults } from "@/components/tools/travel-card/travel-card-results";
import { TravelCardCostChart } from "@/components/tools/travel-card/travel-card-cost-chart";
import { useMounted } from "@/components/tools/travel-card/use-mounted";

export function TravelCardTool() {
  const t = useTranslations("travel-card");
  const tTool = useTranslations("tools.travel-card");
  const tShared = useTranslations("shared");

  const mounted = useMounted();

  const cards = useTravelCardStore((state) => state.cards);
  const trip = useTravelCardStore((state) => state.trip);
  const addCard = useTravelCardStore((state) => state.addCard);
  const updateCard = useTravelCardStore((state) => state.updateCard);
  const removeCard = useTravelCardStore((state) => state.removeCard);
  const setTrip = useTravelCardStore((state) => state.setTrip);
  const replaceState = useTravelCardStore((state) => state.replaceState);
  const reset = useTravelCardStore((state) => state.reset);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const comparison = useMemo(() => {
    if (!mounted || cards.length === 0 || trip.foreignSpend <= 0) {
      return { cardResults: [], bestCardIndex: -1 };
    }
    try {
      return compareTravelCards(cards, trip);
    } catch {
      return { cardResults: [], bestCardIndex: -1 };
    }
  }, [mounted, cards, trip]);

  function validateAndShowErrors(): boolean {
    const newErrors: Record<string, string | undefined> = {};
    for (const card of cards) {
      if (!card.name.trim()) {
        newErrors[`card-${card.id}-name`] = t("cards.validation.nameRequired");
      }
    }
    if (trip.foreignSpend <= 0) {
      newErrors.foreignSpend = t("trip.validation.spendPositive");
    }
    if (trip.daysAbroad < 1) {
      newErrors.daysAbroad = t("trip.validation.daysPositive");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleAddCard() {
    if (cards.length >= 5) return;
    addCard(createDefaultCard());
  }

  function handleUpdateCard(
    id: string,
    patch: Partial<Omit<TravelCardInput, "id">>
  ) {
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.startsWith(`card-${id}-`)) delete next[key];
      }
      return next;
    });
    updateCard(id, patch);
  }

  function handleRemoveCard(id: string) {
    if (cards.length <= 1) return;
    removeCard(id);
  }

  function handleExport() {
    if (!validateAndShowErrors()) return;
    const snapshot: TravelCardToolPersisted = { cards, trip };
    downloadJson(
      `finplan-${TRAVEL_CARD_TOOL_ID}-${new Date().toISOString().slice(0, 10)}.json`,
      createExportEnvelope(TRAVEL_CARD_TOOL_ID, TRAVEL_CARD_SCHEMA_VERSION, snapshot)
    );
  }

  function handleImport(data: unknown) {
    const envelope = readExportEnvelope(data, TRAVEL_CARD_TOOL_ID);
    if (envelope.schemaVersion !== TRAVEL_CARD_SCHEMA_VERSION) {
      throw new Error(t("error.importVersion"));
    }
    const snapshot = sanitizeTravelCardToolPersisted(envelope.data);
    if (snapshot === null) {
      throw new Error(tShared("importError"));
    }
    replaceState(snapshot);
  }

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8" aria-busy="true">
        <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {tTool("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{tTool("description")}</p>
      </header>

      <TravelCardToolbar
        onSeed={() => replaceState(createTravelCardDemoState())}
        onReset={reset}
        onExport={handleExport}
        onImport={handleImport}
      />

      <TravelCardCardsList
        cards={cards}
        onAddCard={handleAddCard}
        onUpdateCard={handleUpdateCard}
        onRemoveCard={handleRemoveCard}
        errors={errors}
      />

      <TravelTripInputs
        trip={trip}
        onTripChange={setTrip}
        errors={errors}
      />

      {comparison.cardResults.length > 0 ? (
        <>
          <TravelCardResults
            cardResults={comparison.cardResults}
            bestCardIndex={comparison.bestCardIndex}
            currency={trip.homeCurrency}
          />
          <TravelCardCostChart
            cardResults={comparison.cardResults}
            currency={trip.homeCurrency}
          />
        </>
      ) : null}
    </div>
  );
}
