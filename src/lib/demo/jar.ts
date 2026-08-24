import type {
  JarExpenseEntry,
  JarIncomeEntry,
  JarTransferEntry,
} from "@/lib/finance/jars";
import type { JarToolPersisted } from "@/lib/storage/jar-store";

const DEMO_JARS: JarToolPersisted["jars"] = [
  { id: "demo-jar-nec", name: "Necessities", allocationPercent: 0.55 },
  { id: "demo-jar-ffa", name: "Financial freedom", allocationPercent: 0.1 },
  { id: "demo-jar-edu", name: "Education", allocationPercent: 0.1 },
  { id: "demo-jar-lts", name: "Long-term savings", allocationPercent: 0.1 },
  { id: "demo-jar-play", name: "Play", allocationPercent: 0.1 },
  { id: "demo-jar-give", name: "Give", allocationPercent: 0.05 },
];

const MONTHLY_INCOME = 4000;

function salaryAllocations(): JarIncomeEntry["allocations"] {
  return [
    { jarId: "demo-jar-nec", amount: 2200 },
    { jarId: "demo-jar-ffa", amount: 400 },
    { jarId: "demo-jar-edu", amount: 400 },
    { jarId: "demo-jar-lts", amount: 400 },
    { jarId: "demo-jar-play", amount: 400 },
    { jarId: "demo-jar-give", amount: 200 },
  ];
}

function salaryIncomes(): JarIncomeEntry[] {
  return [
    {
      id: "demo-income-3",
      amount: MONTHLY_INCOME,
      date: "2026-08-01",
      note: "August salary",
      allocations: salaryAllocations(),
    },
    {
      id: "demo-income-2",
      amount: MONTHLY_INCOME,
      date: "2026-07-01",
      note: "July salary",
      allocations: salaryAllocations(),
    },
    {
      id: "demo-income-1",
      amount: MONTHLY_INCOME,
      date: "2026-06-01",
      note: "June salary",
      allocations: salaryAllocations(),
    },
  ];
}

function demoExpenses(): JarExpenseEntry[] {
  return [
    {
      id: "demo-expense-1",
      jarId: "demo-jar-nec",
      amount: 1250,
      date: "2026-08-03",
      note: "Rent and utilities",
    },
    {
      id: "demo-expense-2",
      jarId: "demo-jar-nec",
      amount: 268.5,
      date: "2026-08-05",
      note: "Groceries restock",
    },
    {
      id: "demo-expense-3",
      jarId: "demo-jar-edu",
      amount: 39.9,
      date: "2026-07-12",
      note: "Investing course",
    },
    {
      id: "demo-expense-4",
      jarId: "demo-jar-play",
      amount: 84,
      date: "2026-07-18",
      note: "Concert tickets",
    },
    {
      id: "demo-expense-5",
      jarId: "demo-jar-give",
      amount: 120,
      date: "2026-06-20",
      note: "Community fundraiser",
    },
  ];
}

function demoTransfers(): JarTransferEntry[] {
  return [
    {
      id: "demo-transfer-1",
      fromJarId: "demo-jar-play",
      toJarId: "demo-jar-lts",
      amount: 60,
      date: "2026-07-31",
      note: "Unspent play money into savings",
    },
    {
      id: "demo-transfer-2",
      fromJarId: "demo-jar-lts",
      toJarId: "demo-jar-nec",
      amount: 150,
      date: "2026-08-04",
      note: "Car repair buffer",
    },
  ];
}

export function createJarDemoState(): JarToolPersisted {
  return {
    jars: DEMO_JARS.map((jar) => ({ ...jar })),
    incomes: salaryIncomes(),
    expenses: demoExpenses(),
    transfers: demoTransfers(),
  };
}
