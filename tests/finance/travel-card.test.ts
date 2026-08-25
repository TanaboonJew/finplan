import { describe, expect, it } from "vitest";
import {
  computeCardTripCost,
  compareTravelCards,
  estimateVatRefund,
  VAT_PRESETS,
  isValidVatPresetKey,
  getVatPreset,
  type TravelCardInput,
  type TripParams,
} from "@/lib/finance/travel-card";

const WISE_CARD: TravelCardInput = {
  id: "wise",
  name: "Wise card",
  annualFee: 0,
  fxFeePercent: 0.005,
  fxMarkupPercent: 0,
  rewardForeignPercent: 0.01,
  rewardDomesticPercent: 0.01,
  atmFeeFlat: 0,
};

const TRAVEL_REWARDS: TravelCardInput = {
  id: "travel",
  name: "Travel rewards",
  annualFee: 95,
  fxFeePercent: 0.03,
  fxMarkupPercent: 0.01,
  rewardForeignPercent: 0.03,
  rewardDomesticPercent: 0.01,
  atmFeeFlat: 5,
};

const NO_FEE_DEBIT: TravelCardInput = {
  id: "debit",
  name: "No-fee debit",
  annualFee: 0,
  fxFeePercent: 0,
  fxMarkupPercent: 0,
  rewardForeignPercent: 0,
  rewardDomesticPercent: 0,
  atmFeeFlat: 5,
};

const EU_TRIP: TripParams = {
  foreignSpend: 3000,
  daysAbroad: 14,
  homeCurrency: "USD",
  destinationCurrency: "EUR",
  vatRate: 0.2,
  vatMinSpend: 75.01,
  enableVatRefund: true,
};

describe("estimateVatRefund", () => {
  it("returns zero when spend is below minimum", () => {
    expect(estimateVatRefund(50, 0.2, 75.01)).toBe(0);
  });

  it("returns zero when vat rate is zero", () => {
    expect(estimateVatRefund(100, 0, 50)).toBe(0);
  });

  it("computes VAT refund correctly", () => {
    expect(estimateVatRefund(1000, 0.2, 75.01)).toBeCloseTo(200);
  });

  it("returns zero for negative spend", () => {
    expect(estimateVatRefund(-100, 0.2, 75.01)).toBe(0);
  });
});

describe("computeCardTripCost", () => {
  it("computes correct FX fee for Wise card", () => {
    const result = computeCardTripCost(WISE_CARD, EU_TRIP);
    expect(result.fxFee).toBeCloseTo(3000 * 0.005);
    expect(result.fxMarkup).toBe(0);
    expect(result.totalFxCost).toBeCloseTo(15);
  });

  it("computes correct foreign reward", () => {
    const result = computeCardTripCost(WISE_CARD, EU_TRIP);
    expect(result.foreignReward).toBeCloseTo(3000 * 0.01);
  });

  it("computes VAT refund correctly when enabled", () => {
    const result = computeCardTripCost(WISE_CARD, EU_TRIP);
    expect(result.vatRefund).toBeCloseTo(3000 * 0.2);
  });

  it("computes VAT refund as zero when disabled", () => {
    const trip: TripParams = { ...EU_TRIP, enableVatRefund: false };
    const result = computeCardTripCost(WISE_CARD, trip);
    expect(result.vatRefund).toBe(0);
  });

  it("prorates annual fee correctly", () => {
    const result = computeCardTripCost(TRAVEL_REWARDS, EU_TRIP);
    expect(result.annualFeeProrated).toBeCloseTo(95 * (14 / 365));
  });

  it("computes zero annual fee prorated for zero-fee card", () => {
    const result = computeCardTripCost(WISE_CARD, EU_TRIP);
    expect(result.annualFeeProrated).toBe(0);
  });

  it("netTripCost equals foreignSpend minus totalSavings", () => {
    const result = computeCardTripCost(WISE_CARD, EU_TRIP);
    expect(result.netTripCost).toBeCloseTo(
      EU_TRIP.foreignSpend - result.totalSavings
    );
  });

  it("totalSavings equals rewards + vat - fx cost - annual fee", () => {
    const result = computeCardTripCost(WISE_CARD, EU_TRIP);
    const expected =
      result.foreignReward +
      result.vatRefund -
      result.totalFxCost -
      result.annualFeeProrated;
    expect(result.totalSavings).toBeCloseTo(expected);
  });

  it("returns zero cost with zero foreign spend", () => {
    const trip: TripParams = { ...EU_TRIP, foreignSpend: 0 };
    const result = computeCardTripCost(WISE_CARD, trip);
    expect(result.fxFee).toBe(0);
    expect(result.fxMarkup).toBe(0);
    expect(result.foreignReward).toBe(0);
    expect(result.vatRefund).toBe(0);
    expect(result.annualFeeProrated).toBe(0);
  });
});

describe("compareTravelCards", () => {
  it("returns empty for no cards", () => {
    const result = compareTravelCards([], EU_TRIP);
    expect(result.cardResults).toHaveLength(0);
    expect(result.bestCardIndex).toBe(-1);
  });

  it("returns one result per card", () => {
    const result = compareTravelCards(
      [WISE_CARD, TRAVEL_REWARDS, NO_FEE_DEBIT],
      EU_TRIP
    );
    expect(result.cardResults).toHaveLength(3);
  });

  it("identifies the best card correctly", () => {
    const result = compareTravelCards(
      [WISE_CARD, TRAVEL_REWARDS, NO_FEE_DEBIT],
      EU_TRIP
    );
    expect(result.bestCardIndex).toBeGreaterThanOrEqual(0);
    expect(result.bestCardIndex).toBeLessThan(3);
    const bestScore = result.cardResults[result.bestCardIndex].result.score;
    for (const cr of result.cardResults) {
      expect(cr.result.score).toBeLessThanOrEqual(bestScore + 0.01);
    }
  });

  it("cards with higher FX fees have higher net trip cost", () => {
    const result = compareTravelCards(
      [WISE_CARD, TRAVEL_REWARDS],
      EU_TRIP
    );
    const wiseResult = result.cardResults.find(
      (cr) => cr.card.id === "wise"
    )!;
    const travelResult = result.cardResults.find(
      (cr) => cr.card.id === "travel"
    )!;
    expect(wiseResult.result.netTripCost).toBeLessThan(
      travelResult.result.netTripCost
    );
  });

  it("score equals negative netTripCost", () => {
    const result = compareTravelCards([WISE_CARD], EU_TRIP);
    expect(result.cardResults[0].result.score).toBe(
      -result.cardResults[0].result.netTripCost
    );
  });
});

describe("VAT_PRESETS", () => {
  it("has EU preset with 20% rate", () => {
    expect(VAT_PRESETS.EU.rate).toBe(0.2);
    expect(VAT_PRESETS.EU.minSpend).toBeGreaterThan(0);
  });

  it("has None preset with zero rate", () => {
    expect(VAT_PRESETS.None.rate).toBe(0);
    expect(VAT_PRESETS.None.minSpend).toBe(0);
  });
});

describe("isValidVatPresetKey", () => {
  it("returns true for valid keys", () => {
    expect(isValidVatPresetKey("EU")).toBe(true);
    expect(isValidVatPresetKey("None")).toBe(true);
  });

  it("returns false for invalid keys", () => {
    expect(isValidVatPresetKey("Invalid")).toBe(false);
    expect(isValidVatPresetKey("")).toBe(false);
  });
});

describe("getVatPreset", () => {
  it("returns the correct preset for a valid key", () => {
    const preset = getVatPreset("UK");
    expect(preset.rate).toBe(0.2);
  });

  it("returns None preset for an unknown key", () => {
    const preset = getVatPreset("Unknown");
    expect(preset.rate).toBe(0);
  });
});
