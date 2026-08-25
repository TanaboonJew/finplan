import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  UNCATEGORIZED,
  applyRules,
  isValidIsoDate,
  type CategoryRule,
  type StatementToolPersisted,
  type StatementTransaction,
} from "@/lib/finance/statement";

export const STATEMENT_EXPORT_SCHEMA_VERSION = 1;

export type {
  CategoryRule,
  StatementToolPersisted,
  StatementTransaction,
};

interface StatementToolActions {
  setTransactions: (transactions: StatementTransaction[]) => void;
  removeTransaction: (id: string) => void;
  updateCategory: (id: string, category: string) => void;
  addRule: (pattern: string, category: string) => string | null;
  updateRule: (id: string, patch: Partial<Omit<CategoryRule, "id">>) => void;
  removeRule: (id: string) => void;
  applyRulesToAll: () => void;
  replaceAll: (data: unknown) => void;
  reset: () => void;
}

export type StatementToolStore = StatementToolPersisted & StatementToolActions;

export const EMPTY_STATEMENT_STATE: StatementToolPersisted = {
  transactions: [],
  rules: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: Record<string, unknown>, key: string): string {
  const raw = value[key];
  if (typeof raw !== "string") {
    throw new TypeError(`statement export field "${key}" must be a string`);
  }
  return raw;
}

function requireFinite(value: Record<string, unknown>, key: string): number {
  const raw = value[key];
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new TypeError(
      `statement export field "${key}" must be a finite number`
    );
  }
  return raw;
}

function parseTransaction(row: unknown): StatementTransaction {
  if (!isRecord(row)) {
    throw new TypeError("transaction entry must be an object");
  }
  const date = requireString(row, "date");
  if (!isValidIsoDate(date)) {
    throw new TypeError(`statement export field "date" must be YYYY-MM-DD`);
  }
  return {
    id: requireString(row, "id"),
    date,
    description: requireString(row, "description"),
    amount: requireFinite(row, "amount"),
    category:
      typeof row.category === "string" && row.category.length > 0
        ? row.category
        : UNCATEGORIZED,
  };
}

function parseRule(row: unknown): CategoryRule {
  if (!isRecord(row)) throw new TypeError("rule entry must be an object");
  return {
    id: requireString(row, "id"),
    pattern: requireString(row, "pattern"),
    category: requireString(row, "category"),
  };
}

export function parseStatementToolState(
  value: unknown
): StatementToolPersisted {
  if (!isRecord(value)) {
    throw new TypeError("statement data must be a JSON object");
  }
  return {
    transactions: Array.isArray(value.transactions)
      ? value.transactions.map(parseTransaction)
      : [],
    rules: Array.isArray(value.rules) ? value.rules.map(parseRule) : [],
  };
}

function newId(): string {
  return crypto.randomUUID();
}

export const useStatementStore = create<StatementToolStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATEMENT_STATE,

      setTransactions: (transactions) => {
        set({ transactions });
        get().applyRulesToAll();
      },

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      updateCategory: (id, category) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id
              ? { ...t, category: category.trim() || UNCATEGORIZED }
              : t
          ),
        })),

      addRule: (pattern, category) => {
        const trimmed = pattern.trim();
        if (trimmed.length === 0 || category.trim().length === 0) return null;
        const id = newId();
        set((state) => ({
          rules: [...state.rules, { id, pattern: trimmed, category: category.trim() }],
        }));
        return id;
      },

      updateRule: (id, patch) =>
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id ? { ...rule, ...patch } : rule
          ),
        })),

      removeRule: (id) =>
        set((state) => ({
          rules: state.rules.filter((rule) => rule.id !== id),
        })),

      applyRulesToAll: () => {
        set((state) => ({
          transactions: applyRules(state.transactions, state.rules),
        }));
      },

      replaceAll: (data) => {
        set(parseStatementToolState(data));
      },

      reset: () => {
        set(EMPTY_STATEMENT_STATE);
      },
    }),
    {
      name: "finplan:statement:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
