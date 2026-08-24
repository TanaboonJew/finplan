import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  isCategoryKind,
  type CategoryKind,
} from "@/lib/finance/budget";
import { MONTHS_PER_YEAR } from "@/lib/finance/constants";

export interface BudgetCategory {
  id: string;
  name: string;
  kind: CategoryKind;
  rolloverEnabled: boolean;
  plans: number[];
}

export interface BudgetEntry {
  id: string;
  categoryId: string;
  month: number;
  amount: number;
  date: string;
  note: string;
}

export interface BudgetToolPersisted {
  year: number;
  categories: BudgetCategory[];
  entries: BudgetEntry[];
}

export const BUDGET_EXPORT_SCHEMA_VERSION = 1;

interface BudgetToolActions {
  setYear: (year: number) => void;
  addCategory: (name: string, kind: CategoryKind) => string;
  updateCategory: (
    id: string,
    patch: Partial<Pick<BudgetCategory, "name" | "kind" | "rolloverEnabled">>
  ) => void;
  removeCategory: (id: string) => void;
  setPlan: (categoryId: string, month: number, amount: number | null) => void;
  addEntry: (entry: {
    categoryId: string;
    month: number;
    amount: number;
    date: string;
    note: string;
  }) => void;
  removeEntry: (id: string) => void;
  replaceAll: (data: unknown) => void;
  reset: () => void;
}

export type BudgetToolStore = BudgetToolPersisted & BudgetToolActions;

export const EMPTY_BUDGET_STATE: BudgetToolPersisted = {
  year: new Date().getFullYear(),
  categories: [],
  entries: [],
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireArray(value: Record<string, unknown>, key: string): unknown[] {
  const raw = value[key];
  if (!Array.isArray(raw)) {
    throw new TypeError(`budget export field "${key}" must be an array`);
  }
  return raw;
}

function requireString(value: Record<string, unknown>, key: string): string {
  const raw = value[key];
  if (typeof raw !== "string") {
    throw new TypeError(`budget export field "${key}" must be a string`);
  }
  return raw;
}

function requireFinite(
  value: Record<string, unknown>,
  key: string,
  minimum = Number.NEGATIVE_INFINITY
): number {
  const raw = value[key];
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < minimum) {
    throw new TypeError(
      `budget export field "${key}" must be a finite number >= ${minimum}`
    );
  }
  return raw;
}

function requireMonth(value: Record<string, unknown>, key: string): number {
  const raw = requireFinite(value, key, 0);
  if (!Number.isInteger(raw) || raw >= MONTHS_PER_YEAR) {
    throw new TypeError(
      `budget export field "${key}" must be an integer between 0 and ${MONTHS_PER_YEAR - 1}`
    );
  }
  return raw;
}

function parsePlans(row: unknown): number[] {
  if (!isRecord(row)) {
    throw new TypeError("budget category must be an object");
  }
  const raw = row.plans;
  if (
    !Array.isArray(raw) ||
    raw.length !== MONTHS_PER_YEAR ||
    raw.some((amount) => typeof amount !== "number" || !Number.isFinite(amount) || amount < 0)
  ) {
    throw new TypeError(
      `budget export field "plans" must be ${MONTHS_PER_YEAR} non-negative finite numbers`
    );
  }
  return [...raw] as number[];
}

function parseCategory(row: unknown): BudgetCategory {
  const record = isRecord(row) ? row : null;
  if (!record) throw new TypeError("budget category must be an object");
  const kind = record.kind;
  if (!isCategoryKind(kind)) {
    throw new TypeError('budget category "kind" must be "expense" or "savings"');
  }
  return {
    id: requireString(record, "id"),
    name: requireString(record, "name"),
    kind,
    rolloverEnabled: record.rolloverEnabled === true,
    plans: parsePlans(record),
  };
}

function parseEntry(row: unknown): BudgetEntry {
  if (!isRecord(row)) throw new TypeError("budget entry must be an object");
  const parsed: BudgetEntry = {
    id: requireString(row, "id"),
    categoryId: requireString(row, "categoryId"),
    month: requireMonth(row, "month"),
    amount: requireFinite(row, "amount", 0),
    date: requireString(row, "date"),
    note: requireString(row, "note"),
  };
  if (parsed.amount <= 0 || !DATE_PATTERN.test(parsed.date)) {
    throw new TypeError("budget entry has an invalid amount or date");
  }
  return parsed;
}

export function parseBudgetToolState(value: unknown): BudgetToolPersisted {
  if (!isRecord(value)) {
    throw new TypeError("budget data must be a JSON object");
  }
  const year = requireFinite(value, "year");
  if (!Number.isInteger(year) || year < 1970 || year > 2999) {
    throw new TypeError('budget export field "year" must be a sane year');
  }
  return {
    year,
    categories: requireArray(value, "categories").map(parseCategory),
    entries: requireArray(value, "entries").map(parseEntry),
  };
}

function newId(): string {
  return crypto.randomUUID();
}

function sanitizePlanAmount(amount: number | null): number {
  if (amount === null || !Number.isFinite(amount)) return 0;
  return Math.max(0, amount);
}

export const useBudgetStore = create<BudgetToolStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_BUDGET_STATE,

      setYear: (year) => {
        if (!Number.isInteger(year)) return;
        set({ year });
      },

      addCategory: (name, kind) => {
        const id = newId();
        set((state) => ({
          categories: [
            ...state.categories,
            {
              id,
              name: name.trim() || "Untitled",
              kind,
              rolloverEnabled: false,
              plans: Array.from({ length: MONTHS_PER_YEAR }, () => 0),
            },
          ],
        }));
        return id;
      },

      updateCategory: (id, patch) =>
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, ...patch } : category
          ),
        })),

      removeCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter(
            (category) => category.id !== id
          ),
          entries: state.entries.filter((entry) => entry.categoryId !== id),
        })),

      setPlan: (categoryId, month, amount) => {
        if (!(month >= 0) || !(month < MONTHS_PER_YEAR)) return;
        if (!Number.isInteger(month)) return;
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  plans: category.plans.map((value, index) =>
                    index === month ? sanitizePlanAmount(amount) : value
                  ),
                }
              : category
          ),
        }));
      },

      addEntry: ({ categoryId, month, amount, date, note }) => {
        if (!(amount > 0) || !Number.isFinite(amount)) return;
        if (!(month >= 0) || !(month < MONTHS_PER_YEAR)) return;
        if (!get().categories.some((category) => category.id === categoryId)) {
          return;
        }
        set((state) => ({
          entries: [
            {
              id: newId(),
              categoryId,
              month,
              amount,
              date,
              note: note.trim(),
            },
            ...state.entries,
          ],
        }));
      },

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        })),

      replaceAll: (data) => {
        set(parseBudgetToolState(data));
      },

      reset: () => {
        set(EMPTY_BUDGET_STATE);
      },
    }),
    {
      name: "finplan:budget:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

