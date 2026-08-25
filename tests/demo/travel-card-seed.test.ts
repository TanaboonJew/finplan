import { describe, expect, it } from "vitest";
import {
  computeCardTripCost,
  compareTravelCards,
} from "@/lib/finance/travel-card";
import { createTravelCardDemoState } from "@/lib/demo/travel-card";

describe("travel-card demo seed", () => {
  it("produces a complete snapshot", () => {
    const snapshot = createTravelCardDemoState();
    expect(snapshot.cards.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.trip.foreignSpend).toBeGreaterThan(0);
    expect(snapshot.trip.daysAbroad).toBeGreaterThan(0);
    expect(snapshot.trip.homeCurrency).toBe("USD");
    for (const card of snapshot.cards) {
      expect(card.id).toBeTruthy();
      expect(card.name.length).toBeGreaterThan(0);
      expect(card.annualFee).toBeGreaterThanOrEqual(0);
      expect(card.fxFeePercent).toBeGreaterThanOrEqual(0);
    }
  });

  it("produces valid comparison results for all cards", () => {
    const snapshot = createTravelCardDemoState();
    const result = compareTravelCards(snapshot.cards, snapshot.trip);
    expect(result.cardResults).toHaveLength(snapshot.cards.length);
    expect(result.bestCardIndex).toBeGreaterThanOrEqual(0);
    expect(result.bestCardIndex).toBeLessThan(snapshot.cards.length);
    for (const cr of result.cardResults) {
      expect(cr.result.netTripCost).toBeGreaterThan(0);
      expect(cr.result.score).toBeLessThan(0);
    }
  });

  it("has different costs per card (not all identical)", () => {
    const snapshot = createTravelCardDemoState();
    const costs = snapshot.cards.map(
      (card) => computeCardTripCost(card, snapshot.trip).netTripCost
    );
    const unique = new Set(costs.map((c) => Math.round(c * 100)));
    expect(unique.size).toBeGreaterThan(1);
  });
});
