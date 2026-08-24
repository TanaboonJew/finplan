import type { RetirementSnapshot } from "@/lib/storage/retirement-store";

export function createRetirementDemoSnapshot(): RetirementSnapshot {
  return {
    currentAge: 34,
    retirementAge: 60,
    currentSavings: 38500,
    monthlyContribution: 950,
    annualReturnRate: 0.068,
    inflationRate: 0.029,
    desiredRetirementIncome: 52000,
    withdrawalRate: 0.04,
    currency: "USD",
  };
}
