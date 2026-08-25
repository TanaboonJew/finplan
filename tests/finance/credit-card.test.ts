import { describe, expect, it } from "vitest";
import {
  compareCards,
  computeCardRewardValue,
  totalSpend,
  type CreditCardInput,
  type SpendCategory,
} from "@/lib/finance/credit-card";

const CATEGORIES: SpendCategory[] = [
  { id: "groceries", name: "Groceries", annualSpend: 6000 },
  { id: "dining", name: "Dining", annualSpend: 3000 },
  { id: "travel", name: "Travel", annualSpend: 1000 },
];

function makeCard(overrides: Partial<CreditCardInput> = {}): CreditCardInput {
  return {
    id: "card-1",
    name: "Everyday Card",
    network: "visa",
    annualFee: 0,
    foreignFee: 0.02,
    apr: 0.2,
    rewardType: "cashback",
    rewardRates: [{ categoryId: "all", rate: 0.01 }],
    signupBonus: 0,
    pointValue: 0,
    notes: "",
    ...overrides,
  };
}

describe("computeCardRewardValue", () => {
  it("uses the category-specific rate with an 'all' fallback", () => {
    const card = makeCard({
      rewardRates: [
        { categoryId: "groceries", rate: 0.06 },
        { categoryId: "all", rate: 0.01 },
      ],
    });
    const result = computeCardRewardValue(card, CATEGORIES);
    expect(result.rewardsByCategory.find((r) => r.categoryId === "groceries")!.rate).toBe(0.06);
    expect(result.rewardsByCategory.find((r) => r.categoryId === "dining")!.rate).toBe(0.01);
    // 6000*6% + 3000*1% + 1000*1% = 360 + 30 + 10 = 400
    expect(result.annualRewardValue).toBeCloseTo(400, 8);
  });

  it("pays nothing in categories without a matching rate", () => {
    const card = makeCard({ rewardRates: [{ categoryId: "dining", rate: 0.05 }] });
    const result = computeCardRewardValue(card, CATEGORIES);
    expect(result.annualRewardValue).toBeCloseTo(150, 8);
  });

  it("converts points and miles via pointValue", () => {
    const pointsCard = makeCard({
      rewardType: "points",
      pointValue: 0.02,
      rewardRates: [{ categoryId: "all", rate: 2 }],
    });
    // Raw: 10000 * 2 pts per unit = 20000 points * 0.02 = 400
    expect(computeCardRewardValue(pointsCard, CATEGORIES).annualRewardValue).toBeCloseTo(400, 8);

    const milesCard = makeCard({
      rewardType: "miles",
      pointValue: 5, // miles valued at 5 currency units each here
      rewardRates: [{ categoryId: "all", rate: 0.1 }],
    });
    // 10000 * 0.1 = 1000 "miles" * 5 = 5000
    expect(computeCardRewardValue(milesCard, CATEGORIES).annualRewardValue).toBeCloseTo(5000, 8);
  });

  it("handles zero spend everywhere", () => {
    const result = computeCardRewardValue(makeCard(), []);
    expect(result.annualRewardValue).toBe(0);
    expect(result.rewardsByCategory).toEqual([]);
  });

  it("rejects negative fees or spend", () => {
    expect(() => computeCardRewardValue(makeCard({ annualFee: -1 }), CATEGORIES)).toThrow(RangeError);
    expect(() =>
      computeCardRewardValue(makeCard(), [{ id: "x", name: "X", annualSpend: -5 }])
    ).toThrow(RangeError);
  });
});

describe("totalSpend", () => {
  it("sums all categories and returns 0 for none", () => {
    expect(totalSpend(CATEGORIES)).toBe(10000);
    expect(totalSpend([])).toBe(0);
  });
});

describe("compareCards", () => {
  it("nets rewards plus signup bonus minus the annual fee", () => {
    const free = makeCard({ id: "free", name: "Free" });
    const premium = makeCard({
      id: "premium",
      name: "Premium",
      annualFee: 300,
      rewardRates: [{ categoryId: "all", rate: 0.03 }],
      signupBonus: 150,
    });
    const results = compareCards([premium, free], CATEGORIES);

    const premiumResult = results.find((r) => r.cardId === "premium")!;
    // rewards: 10000 * 3% = 300; net = 300 + 150 - 300 = 150
    expect(premiumResult.netAnnualValue).toBeCloseTo(150, 8);
    expect(premiumResult.totalFees).toBe(300);
    const freeResult = results.find((r) => r.cardId === "free")!;
    expect(freeResult.netAnnualValue).toBeCloseTo(100, 8); // 1% of 10000
  });

  it("ranks by net annual value descending regardless of input order", () => {
    const weak = makeCard({
      id: "weak",
      rewardRates: [{ categoryId: "all", rate: 0.005 }],
    });
    const strong = makeCard({
      id: "strong",
      annualFee: 50,
      rewardRates: [{ categoryId: "all", rate: 0.05 }],
    });
    const results = compareCards([weak, strong], CATEGORIES);
    expect(results[0]!.cardId).toBe("strong");
    expect(results[results.length - 1]!.cardId).toBe("weak");
    for (let i = 1; i < results.length; i += 1) {
      expect(results[i]!.netAnnualValue).toBeLessThanOrEqual(
        results[i - 1]!.netAnnualValue
      );
    }
  });

  it("computes effective return on spend and guards zero spend", () => {
    const single = [makeCard({ id: "a", signupBonus: 100 })];
    const [only] = compareCards(single, CATEGORIES);
    expect(only!.effectiveRate).toBeCloseTo(
      (100 + 100) / 10000,
      10
    );
    const empty = compareCards(single, []);
    expect(empty[0]!.effectiveRate).toBe(0);
    expect(empty[0]!.netAnnualValue).toBe(100); // bonus only
  });

  it("returns an empty ranking for no cards", () => {
    expect(compareCards([], CATEGORIES)).toEqual([]);
  });
});
