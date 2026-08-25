import type { FlowSnapshot } from "@/lib/storage/flow-store";
import { currentMonth } from "@/lib/storage/flow-store";

export function createFlowDemoSnapshot(now: Date = new Date()): FlowSnapshot {
  const month = currentMonth(now);
  return {
    streams: [
      {
        id: "demo-salary",
        name: "Salary",
        amount: 4500,
        category: "income",
        startMonth: month,
        endMonth: null,
      },
      {
        id: "demo-freelance",
        name: "Freelance",
        amount: 1200,
        category: "income",
        startMonth: month,
        endMonth: null,
      },
      {
        id: "demo-rent",
        name: "Rent",
        amount: 1400,
        category: "expense",
        startMonth: month,
        endMonth: null,
      },
      {
        id: "demo-groceries",
        name: "Groceries",
        amount: 550,
        category: "expense",
        startMonth: month,
        endMonth: null,
      },
      {
        id: "demo-utilities",
        name: "Utilities",
        amount: 180,
        category: "expense",
        startMonth: month,
        endMonth: null,
      },
      {
        id: "demo-transport",
        name: "Transport",
        amount: 250,
        category: "expense",
        startMonth: month,
        endMonth: null,
      },
      {
        id: "demo-subscriptions",
        name: "Subscriptions",
        amount: 95,
        category: "expense",
        startMonth: month,
        endMonth: null,
      },
    ],
    startingBalance: 5000,
    horizonMonths: 12,
    currency: "USD",
  };
}
