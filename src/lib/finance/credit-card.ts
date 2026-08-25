import { assertNonNegative, assertRate } from "./validation";

export type RewardType = "cashback" | "points" | "miles";

export interface RewardRate {
  categoryId: string;
  rate: number;
}

export interface CreditCardInput {
  id: string;
  name: string;
  network: string;
  annualFee: number;
  foreignFee: number;
  apr: number;
  rewardType: RewardType;
  rewardRates: RewardRate[];
  signupBonus: number;
  pointValue: number;
  notes: string;
}

export interface SpendCategory {
  id: string;
  name: string;
  annualSpend: number;
}

export interface RewardBreakdown {
  categoryId: string;
  spend: number;
  rate: number;
  rewardValue: number;
}

export interface RewardResult {
  annualRewardValue: number;
  rewardsByCategory: RewardBreakdown[];
}

export interface CardComparisonResult {
  cardId: string;
  cardName: string;
  annualRewardValue: number;
  totalFees: number;
  signupBonus: number;
  netAnnualValue: number;
  effectiveRate: number;
  rewardsByCategory: RewardBreakdown[];
}

function resolveRate(
  rewardRates: readonly RewardRate[],
  categoryId: string
): number {
  const specific = rewardRates.find((r) => r.categoryId === categoryId);
  if (specific !== undefined) return specific.rate;
  const fallback = rewardRates.find((r) => r.categoryId === "all");
  return fallback !== undefined ? fallback.rate : 0;
}

function rewardDollarValue(
  rawReward: number,
  rewardType: RewardType,
  pointValue: number
): number {
  if (rewardType === "cashback") return rawReward;
  return rawReward * pointValue;
}

export function computeCardRewardValue(
  card: CreditCardInput,
  categories: readonly SpendCategory[]
): RewardResult {
  assertNonNegative(card.annualFee, "annualFee");
  assertRate(card.foreignFee, "foreignFee");
  assertRate(card.apr, "apr");
  assertNonNegative(card.signupBonus, "signupBonus");
  assertNonNegative(card.pointValue, "pointValue");

  const rewardsByCategory: RewardBreakdown[] = [];
  let totalRewardValue = 0;

  for (const cat of categories) {
    assertNonNegative(cat.annualSpend, `spend[${cat.id}]`);
    const rate = resolveRate(card.rewardRates, cat.id);
    const rawReward = cat.annualSpend * rate;
    const value = rewardDollarValue(rawReward, card.rewardType, card.pointValue);
    rewardsByCategory.push({
      categoryId: cat.id,
      spend: cat.annualSpend,
      rate,
      rewardValue: value,
    });
    totalRewardValue += value;
  }

  return { annualRewardValue: totalRewardValue, rewardsByCategory };
}

export function totalSpend(categories: readonly SpendCategory[]): number {
  let sum = 0;
  for (const cat of categories) {
    assertNonNegative(cat.annualSpend, `spend[${cat.id}]`);
    sum += cat.annualSpend;
  }
  return sum;
}

export function compareCards(
  cards: readonly CreditCardInput[],
  categories: readonly SpendCategory[]
): CardComparisonResult[] {
  const spend = totalSpend(categories);

  const results: CardComparisonResult[] = cards.map((card) => {
    const reward = computeCardRewardValue(card, categories);
    const net = reward.annualRewardValue + card.signupBonus - card.annualFee;
    return {
      cardId: card.id,
      cardName: card.name,
      annualRewardValue: reward.annualRewardValue,
      totalFees: card.annualFee,
      signupBonus: card.signupBonus,
      netAnnualValue: net,
      effectiveRate: spend > 0 ? net / spend : 0,
      rewardsByCategory: reward.rewardsByCategory,
    };
  });

  results.sort((a, b) => b.netAnnualValue - a.netAnnualValue);
  return results;
}
