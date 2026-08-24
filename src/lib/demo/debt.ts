import type { DebtSnapshot } from "@/lib/storage/debt-store";
import { currentMonth } from "@/lib/storage/debt-store";

export function createDebtDemoSnapshot(now: Date = new Date()): DebtSnapshot {
  return {
    debts: [
      {
        id: "demo-credit-card",
        name: "Credit card",
        balance: 4200,
        annualRate: 0.2299,
        minimumPayment: 125,
      },
      {
        id: "demo-student-loan",
        name: "Student loan",
        balance: 11800,
        annualRate: 0.0525,
        minimumPayment: 210,
      },
      {
        id: "demo-auto-loan",
        name: "Auto loan",
        balance: 7400,
        annualRate: 0.071,
        minimumPayment: 265,
      },
      {
        id: "demo-medical-plan",
        name: "Medical payment plan",
        balance: 1350,
        annualRate: 0.115,
        minimumPayment: 55,
      },
    ],
    strategy: "avalanche",
    extraMonthlyPayment: 150,
    currency: "USD",
    startMonth: currentMonth(now),
  };
}
