import type { BudgetToolPersisted } from "@/lib/storage/budget-store";

const DEMO_YEAR = new Date().getFullYear();

function plans(values: number[]): number[] {
  const result = Array.from({ length: 12 }, (_, index) => values[index] ?? values[values.length - 1]);
  return result;
}

function isoDate(month: number): string {
  return `${DEMO_YEAR}-${String(month + 1).padStart(2, "0")}-28`;
}

interface DemoCategorySpec {
  id: string;
  name: string;
  kind: "expense" | "savings";
  rolloverEnabled: boolean;
  plans: number[];
  actuals: Array<[number, number]>; // [month, amount]
}

const SPECS: DemoCategorySpec[] = [
  {
    id: "demo-budget-groceries",
    name: "Groceries",
    kind: "expense",
    rolloverEnabled: false,
    plans: plans([520, 520, 530, 540, 520, 535, 545, 540]),
    actuals: [
      [0, 505.3],
      [1, 548.9],
      [2, 512.4],
      [3, 561.2],
      [4, 498.6],
      [5, 530.15],
      [6, 572.4],
      [7, 489.75],
    ],
  },
  {
    id: "demo-budget-rent",
    name: "Rent & utilities",
    kind: "expense",
    rolloverEnabled: false,
    plans: plans([1250]),
    actuals: [
      [0, 1250],
      [1, 1250],
      [2, 1268.4],
      [3, 1250],
      [4, 1242.1],
      [5, 1250],
      [6, 1301.8],
      [7, 1250],
    ],
  },
  {
    id: "demo-budget-transport",
    name: "Transport",
    kind: "expense",
    rolloverEnabled: true,
    plans: plans([180]),
    actuals: [
      [0, 171.25],
      [1, 196.4],
      [2, 158.9],
      [3, 203.15],
      [4, 149.6],
      [5, 188.05],
      [6, 176.3],
      [7, 164.2],
    ],
  },
  {
    id: "demo-budget-fun",
    name: "Fun money",
    kind: "expense",
    rolloverEnabled: false,
    plans: plans([160]),
    actuals: [
      [0, 184.5],
      [1, 142.75],
      [2, 210.9],
      [3, 96.35],
      [4, 175.2],
      [5, 133.4],
      [6, 246.85],
      [7, 121.6],
    ],
  },
  {
    id: "demo-budget-health",
    name: "Health",
    kind: "expense",
    rolloverEnabled: true,
    plans: plans([90]),
    actuals: [
      [0, 63.4],
      [1, 118.9],
      [2, 27.5],
      [3, 84.2],
      [4, 156.75],
      [5, 39.9],
      [6, 71.25],
      [7, 95.6],
    ],
  },
  {
    id: "demo-budget-emergency",
    name: "Emergency fund",
    kind: "savings",
    rolloverEnabled: true,
    plans: plans([400]),
    actuals: [
      [0, 400],
      [1, 400],
      [2, 400],
      [3, 400],
      [4, 400],
      [5, 400],
      [6, 400],
      [7, 380],
    ],
  },
  {
    id: "demo-budget-trip",
    name: "Trip fund",
    kind: "savings",
    rolloverEnabled: true,
    plans: plans([250]),
    actuals: [
      [0, 250],
      [1, 250],
      [2, 150],
      [3, 250],
      [4, 250],
      [5, 310],
      [6, 250],
      [7, 250],
    ],
  },
];

export function createBudgetDemoState(): BudgetToolPersisted {
  const categories = SPECS.map((spec) => ({
    id: spec.id,
    name: spec.name,
    kind: spec.kind,
    rolloverEnabled: spec.rolloverEnabled,
    plans: [...spec.plans],
  }));

  let entryCounter = 0;
  const entries = SPECS.flatMap((spec) =>
    spec.actuals.map(([month, amount]) => ({
      id: `demo-budget-entry-${(entryCounter += 1)}`,
      categoryId: spec.id,
      month,
      amount,
      date: isoDate(month),
      note: "",
    }))
  ).sort((a, b) => (a.month === b.month ? a.id.localeCompare(b.id) : a.month - b.month));

  return { year: DEMO_YEAR, categories, entries };
}
