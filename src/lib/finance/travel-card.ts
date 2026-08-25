export interface TravelCardInput {
  id: string;
  name: string;
  annualFee: number;
  fxFeePercent: number;
  fxMarkupPercent: number;
  rewardForeignPercent: number;
  rewardDomesticPercent: number;
  atmFeeFlat: number;
}

export interface TripParams {
  foreignSpend: number;
  daysAbroad: number;
  homeCurrency: string;
  destinationCurrency: string;
  vatRate: number;
  vatMinSpend: number;
  enableVatRefund: boolean;
}

export interface TravelCardComparisonResult {
  fxFee: number;
  fxMarkup: number;
  totalFxCost: number;
  foreignReward: number;
  domesticReward: number;
  annualFeeProrated: number;
  vatRefund: number;
  totalSavings: number;
  netTripCost: number;
  score: number;
}

export interface CardResult {
  card: TravelCardInput;
  result: TravelCardComparisonResult;
}

export interface CompareTravelCardsResult {
  cardResults: CardResult[];
  bestCardIndex: number;
}

export const VAT_PRESETS: Record<
  string,
  { rate: number; minSpend: number }
> = {
  EU: { rate: 0.2, minSpend: 75.01 },
  UK: { rate: 0.2, minSpend: 35.0 },
  Japan: { rate: 0.1, minSpend: 5000.0 },
  Thailand: { rate: 0.07, minSpend: 2000.0 },
  Australia: { rate: 0.1, minSpend: 300.0 },
  None: { rate: 0, minSpend: 0 },
};

const VAT_KEYS = ["EU", "UK", "Japan", "Thailand", "Australia", "None"] as const;

export type VatPresetKey = (typeof VAT_KEYS)[number];

export function isValidVatPresetKey(key: string): key is VatPresetKey {
  return (VAT_KEYS as readonly string[]).includes(key);
}

export function getVatPreset(key: string): {
  rate: number;
  minSpend: number;
} {
  return VAT_PRESETS[key] ?? VAT_PRESETS.None;
}

export function estimateVatRefund(
  foreignSpend: number,
  vatRate: number,
  minSpend: number
): number {
  if (foreignSpend < minSpend || vatRate <= 0) return 0;
  return foreignSpend * vatRate;
}

export function computeCardTripCost(
  card: TravelCardInput,
  trip: TripParams
): TravelCardComparisonResult {
  const fxFee = trip.foreignSpend * card.fxFeePercent;
  const fxMarkup = trip.foreignSpend * card.fxMarkupPercent;
  const totalFxCost = fxFee + fxMarkup;

  const foreignReward = trip.foreignSpend * card.rewardForeignPercent;

  const annualFeeProrated =
    trip.daysAbroad > 0
      ? card.annualFee * (trip.daysAbroad / 365)
      : 0;

  const vatRefund = trip.enableVatRefund
    ? estimateVatRefund(trip.foreignSpend, trip.vatRate, trip.vatMinSpend)
    : 0;

  const totalSavings = foreignReward + vatRefund - totalFxCost - annualFeeProrated;
  const netTripCost = trip.foreignSpend - totalSavings;

  return {
    fxFee,
    fxMarkup,
    totalFxCost,
    foreignReward,
    domesticReward: 0,
    annualFeeProrated,
    vatRefund,
    totalSavings,
    netTripCost,
    score: -netTripCost,
  };
}

export function compareTravelCards(
  cards: TravelCardInput[],
  trip: TripParams
): CompareTravelCardsResult {
  if (cards.length === 0) {
    return { cardResults: [], bestCardIndex: -1 };
  }

  const cardResults = cards.map((card) => ({
    card,
    result: computeCardTripCost(card, trip),
  }));

  let bestCardIndex = 0;
  for (let i = 1; i < cardResults.length; i++) {
    if (cardResults[i].result.score > cardResults[bestCardIndex].result.score) {
      bestCardIndex = i;
    }
  }

  return { cardResults, bestCardIndex };
}
