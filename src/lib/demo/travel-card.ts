import type {
  TravelCardToolPersisted,
} from "@/lib/storage/travel-card-store";

export function createTravelCardDemoState(): TravelCardToolPersisted {
  return {
    cards: [
      {
        id: "demo-wise",
        name: "Wise card",
        annualFee: 0,
        fxFeePercent: 0.005,
        fxMarkupPercent: 0,
        rewardForeignPercent: 0.01,
        rewardDomesticPercent: 0.01,
        atmFeeFlat: 0,
      },
      {
        id: "demo-travel-rewards",
        name: "Travel rewards card",
        annualFee: 95,
        fxFeePercent: 0.03,
        fxMarkupPercent: 0.01,
        rewardForeignPercent: 0.03,
        rewardDomesticPercent: 0.01,
        atmFeeFlat: 5,
      },
      {
        id: "demo-no-fee-debit",
        name: "No-fee debit card",
        annualFee: 0,
        fxFeePercent: 0,
        fxMarkupPercent: 0,
        rewardForeignPercent: 0,
        rewardDomesticPercent: 0,
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
}
