import type { LoanToolPersisted } from "@/lib/storage/loan-store";
import { currentMonth } from "@/lib/storage/loan-store";

export function createLoanDemoState(now: Date = new Date()): LoanToolPersisted {
  return {
    loan: {
      id: "demo-mortgage",
      name: "Home mortgage",
      principal: 250_000,
      annualRate: 0.065,
      termMonths: 360,
    },
    refinance: {
      newAnnualRate: 0.055,
      closingCost: 3_000,
      newTermMonths: 360,
    },
    currency: "USD",
    startMonth: currentMonth(now),
  };
}
