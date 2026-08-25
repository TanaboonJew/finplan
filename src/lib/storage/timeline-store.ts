import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const TIMELINE_TOOL_ID = "timeline";
export const TIMELINE_SCHEMA_VERSION = 1;

export type GoalCategory =
  | "house"
  | "kids"
  | "retirement"
  | "education"
  | "custom";

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  startAge: number;
  endAge: number;
  totalCost: number;
  monthlySavings: number;
  annualReturnRate: number;
  inflationRate: number;
}

export interface TimelineSnapshot {
  currentAge: number;
  monthlyBudget: number;
  annualReturnRate: number;
  inflationRate: number;
  goals: Goal[];
  currency: string;
}

interface TimelineStoreState extends TimelineSnapshot {
  addGoal: (goal: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  setCurrentAge: (age: number) => void;
  setMonthlyBudget: (value: number | null) => void;
  setAnnualReturnRate: (rate: number) => void;
  setInflationRate: (rate: number) => void;
  setCurrency: (currency: string) => void;
  replaceState: (snapshot: TimelineSnapshot) => void;
  reset: () => void;
}

const CURRENCY_PATTERN = /^[A-Za-z]{3}$/;
const MAX_AGE = 120;
const MAX_RATE = 0.5;
const MAX_MONTHLY_SAVINGS = 100_000_000;
const MAX_TOTAL_COST = 10_000_000_000;
const MAX_MONTHLY_BUDGET = 100_000_000;

function clampNumber(value: unknown, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function clampMoney(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function clampRate(value: unknown): number {
  return clampNumber(value, 0, MAX_RATE);
}

function clampAge(value: unknown): number {
  return Math.round(clampNumber(value, 0, MAX_AGE));
}

function normalizeCurrency(currency: string): string {
  return CURRENCY_PATTERN.test(currency)
    ? currency.toUpperCase()
    : DEFAULT_TIMELINE_STATE.currency;
}

function sanitizeGoal(value: unknown): Goal | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;

  const validCategories: readonly string[] = [
    "house",
    "kids",
    "retirement",
    "education",
    "custom",
  ];
  const category =
    typeof record.category === "string" &&
    validCategories.includes(record.category)
      ? (record.category as Goal["category"])
      : "custom";

  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name.trim()
      : "Untitled goal";

  const id =
    typeof record.id === "string" && record.id.length > 0
      ? record.id
      : crypto.randomUUID();

  return {
    id,
    name,
    category,
    startAge: clampAge(record.startAge),
    endAge: clampAge(record.endAge),
    totalCost: Math.min(
      clampMoney(record.totalCost),
      MAX_TOTAL_COST
    ),
    monthlySavings: Math.min(
      clampMoney(record.monthlySavings),
      MAX_MONTHLY_SAVINGS
    ),
    annualReturnRate: clampRate(record.annualReturnRate),
    inflationRate: clampRate(record.inflationRate),
  };
}

export function sanitizeTimelineSnapshot(
  value: unknown
): TimelineSnapshot | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;

  const currency =
    typeof record.currency === "string" &&
    CURRENCY_PATTERN.test(record.currency)
      ? record.currency.toUpperCase()
      : DEFAULT_TIMELINE_STATE.currency;

  const rawGoals = Array.isArray(record.goals) ? record.goals : [];
  const goals: Goal[] = [];
  for (const raw of rawGoals) {
    const sanitized = sanitizeGoal(raw);
    if (sanitized !== null) goals.push(sanitized);
  }

  return {
    currentAge: clampAge(record.currentAge),
    monthlyBudget: Math.min(
      clampMoney(record.monthlyBudget),
      MAX_MONTHLY_BUDGET
    ),
    annualReturnRate: clampRate(record.annualReturnRate),
    inflationRate: clampRate(record.inflationRate),
    goals,
    currency,
  };
}

export const DEFAULT_TIMELINE_STATE: TimelineSnapshot = {
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

export const useTimelineStore = create<TimelineStoreState>()(
  persist(
    (set) => ({
      ...DEFAULT_TIMELINE_STATE,
      addGoal: (goal) =>
        set((state) => ({
          goals: [
            ...state.goals,
            {
              ...goal,
              id: crypto.randomUUID(),
              name: goal.name.trim() || "Untitled goal",
              startAge: clampAge(goal.startAge),
              endAge: clampAge(goal.endAge),
              totalCost: Math.min(clampMoney(goal.totalCost), MAX_TOTAL_COST),
              monthlySavings: Math.min(
                clampMoney(goal.monthlySavings),
                MAX_MONTHLY_SAVINGS
              ),
              annualReturnRate: clampRate(goal.annualReturnRate),
              inflationRate: clampRate(goal.inflationRate),
            },
          ],
        })),
      updateGoal: (id, patch) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id !== id
              ? g
              : {
                  ...g,
                  ...(patch.name !== undefined
                    ? { name: (patch.name as string).trim() || g.name }
                    : {}),
                  ...(patch.category !== undefined
                    ? { category: patch.category }
                    : {}),
                  ...(patch.startAge !== undefined
                    ? { startAge: clampAge(patch.startAge) }
                    : {}),
                  ...(patch.endAge !== undefined
                    ? { endAge: clampAge(patch.endAge) }
                    : {}),
                  ...(patch.totalCost !== undefined
                    ? {
                        totalCost: Math.min(
                          clampMoney(patch.totalCost),
                          MAX_TOTAL_COST
                        ),
                      }
                    : {}),
                  ...(patch.monthlySavings !== undefined
                    ? {
                        monthlySavings: Math.min(
                          clampMoney(patch.monthlySavings),
                          MAX_MONTHLY_SAVINGS
                        ),
                      }
                    : {}),
                  ...(patch.annualReturnRate !== undefined
                    ? { annualReturnRate: clampRate(patch.annualReturnRate) }
                    : {}),
                  ...(patch.inflationRate !== undefined
                    ? { inflationRate: clampRate(patch.inflationRate) }
                    : {}),
                }
          ),
        })),
      removeGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),
      setCurrentAge: (age) =>
        set({ currentAge: clampAge(age) }),
      setMonthlyBudget: (value) =>
        set({
          monthlyBudget: Math.min(
            clampMoney(value),
            MAX_MONTHLY_BUDGET
          ),
        }),
      setAnnualReturnRate: (rate) =>
        set({ annualReturnRate: clampRate(rate) }),
      setInflationRate: (rate) =>
        set({ inflationRate: clampRate(rate) }),
      setCurrency: (currency) =>
        set({ currency: normalizeCurrency(currency) }),
      replaceState: (snapshot) =>
        set({
          ...snapshot,
          currency: normalizeCurrency(snapshot.currency),
        }),
      reset: () => set({ ...DEFAULT_TIMELINE_STATE }),
    }),
    {
      name: "finplan:timeline:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) =>
        sanitizeTimelineSnapshot(persisted) ?? DEFAULT_TIMELINE_STATE,
    }
  )
);
