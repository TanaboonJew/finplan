import type { DcaToolPersisted } from "@/lib/storage/dca-store";

export function createDcaDemoState(): DcaToolPersisted {
  return {
    funds: [
      {
        id: "demo-index",
        name: "Low-cost index fund",
        expenseRatio: 0.0003,
        frontLoad: 0,
        exitLoad: 0,
        annualReturn: 0.08,
      },
      {
        id: "demo-active",
        name: "Actively managed fund",
        expenseRatio: 0.015,
        frontLoad: 0.05,
        exitLoad: 0.01,
        annualReturn: 0.095,
      },
    ],
    monthlyContribution: 500,
    horizonMonths: 360,
    currency: "USD",
  };
}
