import { beforeEach, describe, expect, it } from "vitest";
import {
  TRAVEL_CARD_SCHEMA_VERSION,
  createDefaultCard,
  sanitizeTravelCardToolPersisted,
  useTravelCardStore,
  type TravelCardToolPersisted,
} from "@/lib/storage/travel-card-store";

const snapshot: TravelCardToolPersisted = {
  cards: [
    {
      id: "c1",
      name: "Wise card",
      annualFee: 0,
      fxFeePercent: 0.005,
      fxMarkupPercent: 0,
      rewardForeignPercent: 0.01,
      rewardDomesticPercent: 0.01,
      atmFeeFlat: 0,
    },
    {
      id: "c2",
      name: "Travel rewards",
      annualFee: 95,
      fxFeePercent: 0.03,
      fxMarkupPercent: 0.01,
      rewardForeignPercent: 0.03,
      rewardDomesticPercent: 0.01,
      atmFeeFlat: 5,
    },
  ],
  trip: {
    foreignSpend: 3000,
    daysAbroad: 14,
    homeCurrency: "USD",
    destinationCurrency: "EUR",
    vatRate: 0.2,
    vatMinSpend: 75.01,
    enableVatRefund: true,
  },
};

describe("travel-card store", () => {
  beforeEach(() => {
    localStorage.clear();
    useTravelCardStore.getState().reset();
  });

  it("starts empty with defaults", () => {
    const state = useTravelCardStore.getState();
    expect(state.cards).toEqual([]);
    expect(state.trip.foreignSpend).toBe(0);
    expect(state.trip.daysAbroad).toBe(14);
    expect(state.trip.homeCurrency).toBe("USD");
    expect(state.trip.destinationCurrency).toBe("EUR");
    expect(state.trip.enableVatRefund).toBe(true);
  });

  it("adds cards", () => {
    const card = createDefaultCard();
    useTravelCardStore.getState().addCard(card);
    expect(useTravelCardStore.getState().cards).toHaveLength(1);
    expect(useTravelCardStore.getState().cards[0].id).toBe(card.id);
  });

  it("updates card by id", () => {
    useTravelCardStore.getState().addCard(createDefaultCard());
    const id = useTravelCardStore.getState().cards[0].id;
    useTravelCardStore.getState().updateCard(id, { name: "Test", annualFee: 50 });
    expect(useTravelCardStore.getState().cards[0].name).toBe("Test");
    expect(useTravelCardStore.getState().cards[0].annualFee).toBe(50);
  });

  it("removes card by id", () => {
    useTravelCardStore.getState().addCard(createDefaultCard());
    useTravelCardStore.getState().addCard(createDefaultCard());
    const id = useTravelCardStore.getState().cards[0].id;
    useTravelCardStore.getState().removeCard(id);
    expect(useTravelCardStore.getState().cards).toHaveLength(1);
  });

  it("setTrip updates the trip params", () => {
    const newTrip = {
      foreignSpend: 5000,
      daysAbroad: 21,
      homeCurrency: "EUR",
      destinationCurrency: "GBP",
      vatRate: 0.25,
      vatMinSpend: 35,
      enableVatRefund: false,
    };
    useTravelCardStore.getState().setTrip(newTrip);
    expect(useTravelCardStore.getState().trip).toEqual(newTrip);
  });

  it("replaceState overwrites the whole slice", () => {
    useTravelCardStore.getState().replaceState(snapshot);
    const state = useTravelCardStore.getState();
    expect(state.cards).toHaveLength(2);
    expect(state.trip.foreignSpend).toBe(3000);
    expect(state.trip.homeCurrency).toBe("USD");
  });

  it("persists to localStorage under the versioned key", () => {
    useTravelCardStore.getState().replaceState(snapshot);
    const raw = localStorage.getItem("finplan:travel-card:v1");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as {
      state: { trip: { foreignSpend: number } };
      version: number;
    };
    expect(parsed.state.trip.foreignSpend).toBe(3000);
    expect(parsed.version).toBe(1);
  });

  it("creates default card with valid id", () => {
    const card = createDefaultCard();
    expect(card.id).toBeTruthy();
    expect(card.id.length).toBeGreaterThan(0);
  });

  it("reset restores defaults", () => {
    useTravelCardStore.getState().addCard(createDefaultCard());
    useTravelCardStore.getState().reset();
    expect(useTravelCardStore.getState().cards).toEqual([]);
    expect(useTravelCardStore.getState().trip.foreignSpend).toBe(0);
  });
});

describe("sanitizeTravelCardToolPersisted", () => {
  it("accepts a valid snapshot", () => {
    const result = sanitizeTravelCardToolPersisted(snapshot);
    expect(result?.cards).toHaveLength(2);
    expect(result?.trip.homeCurrency).toBe("USD");
  });

  it("rejects non-objects and missing cards array", () => {
    expect(sanitizeTravelCardToolPersisted(null)).toBeNull();
    expect(sanitizeTravelCardToolPersisted("nope")).toBeNull();
    expect(sanitizeTravelCardToolPersisted({})).toBeNull();
  });

  it("drops card entries without names and clamps bad numbers", () => {
    const result = sanitizeTravelCardToolPersisted({
      cards: [
        { name: "", fxFeePercent: 0.01 },
        { name: "Ok", fxFeePercent: -1, annualFee: "x" },
        "junk",
      ],
      trip: {
        foreignSpend: -100,
        daysAbroad: 0,
        homeCurrency: "NOPE!",
        destinationCurrency: "also-bad",
      },
    });
    expect(result?.cards).toHaveLength(1);
    expect(result?.cards[0]).toMatchObject({
      name: "Ok",
      fxFeePercent: 0,
    });
    expect(result?.trip.foreignSpend).toBe(0);
    expect(result?.trip.daysAbroad).toBe(1);
    expect(result?.trip.homeCurrency).toBe("USD");
    expect(result?.trip.destinationCurrency).toBe("USD");
  });

  it("matches the exported schema version constant", () => {
    expect(TRAVEL_CARD_SCHEMA_VERSION).toBe(1);
  });
});
