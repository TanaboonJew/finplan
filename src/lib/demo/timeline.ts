import type { TimelineSnapshot } from "@/lib/storage/timeline-store";

export function createTimelineDemoSnapshot(): TimelineSnapshot {
  return {
    currentAge: 30,
    monthlyBudget: 1500,
    annualReturnRate: 0.07,
    inflationRate: 0.03,
    goals: [
      {
        id: "house",
        name: "House deposit",
        category: "house",
        startAge: 32,
        endAge: 35,
        totalCost: 45000,
        monthlySavings: 500,
        annualReturnRate: 0.04,
        inflationRate: 0.03,
      },
      {
        id: "kids",
        name: "Kids education",
        category: "kids",
        startAge: 33,
        endAge: 36,
        totalCost: 25000,
        monthlySavings: 400,
        annualReturnRate: 0.03,
        inflationRate: 0.03,
      },
      {
        id: "retirement",
        name: "Retirement",
        category: "retirement",
        startAge: 30,
        endAge: 60,
        totalCost: 600000,
        monthlySavings: 600,
        annualReturnRate: 0.07,
        inflationRate: 0.03,
      },
    ],
    currency: "USD",
  };
}
