import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  allocateIncome,
  computeJarActivity,
  isJarReferenced,
  type JarExpenseEntry,
  type JarIncomeEntry,
  type JarSplit,
  type JarTransferEntry,
} from "@/lib/finance/jars";

export interface Jar extends JarSplit {
  name: string;
}

export interface JarToolPersisted {
  jars: Jar[];
  incomes: JarIncomeEntry[];
  expenses: JarExpenseEntry[];
  transfers: JarTransferEntry[];
}

export const JAR_EXPORT_SCHEMA_VERSION = 1;

interface JarToolActions {
  addJar: (name: string) => string;
  updateJar: (
    id: string,
    patch: Partial<Pick<Jar, "name" | "allocationPercent">>
  ) => void;
  removeJar: (id: string) => void;
  addIncome: (entry: { amount: number; date: string; note: string }) => void;
  removeIncome: (id: string) => void;
  addExpense: (entry: {
    jarId: string;
    amount: number;
    date: string;
    note: string;
  }) => void;
  removeExpense: (id: string) => void;
  addTransfer: (entry: {
    fromJarId: string;
    toJarId: string;
    amount: number;
    date: string;
    note: string;
  }) => void;
  removeTransfer: (id: string) => void;
  replaceAll: (data: unknown) => void;
  reset: () => void;
}

export type JarToolStore = JarToolPersisted & JarToolActions;

export const EMPTY_JAR_STATE: JarToolPersisted = {
  jars: [],
  incomes: [],
  expenses: [],
  transfers: [],
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireArray(value: Record<string, unknown>, key: string): unknown[] {
  const raw = value[key];
  if (!Array.isArray(raw)) {
    throw new TypeError(`jar export field "${key}" must be an array`);
  }
  return raw;
}

function requireString(value: Record<string, unknown>, key: string): string {
  const raw = value[key];
  if (typeof raw !== "string") {
    throw new TypeError(`jar export field "${key}" must be a string`);
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
      `jar export field "${key}" must be a finite number >= ${minimum}`
    );
  }
  return raw;
}

function parseJar(row: unknown): Jar {
  if (!isRecord(row)) throw new TypeError("jar entry must be an object");
  return {
    id: requireString(row, "id"),
    name: requireString(row, "name"),
    allocationPercent: requireFinite(row, "allocationPercent", 0),
  };
}

function parseAllocations(row: unknown): JarAllocationRow[] {
  if (!isRecord(row)) {
    throw new TypeError("allocation entry must be an object");
  }
  const raw = requireArray(row, "allocations");
  return raw.map((allocation) => {
    if (!isRecord(allocation)) {
      throw new TypeError("allocation entry must be an object");
    }
    return {
      jarId: requireString(allocation, "jarId"),
      amount: requireFinite(allocation, "amount", 0),
    };
  });
}

type JarAllocationRow = JarIncomeEntry["allocations"][number];

function parseIncome(row: unknown): JarIncomeEntry {
  if (!isRecord(row)) throw new TypeError("income entry must be an object");
  const parsed: JarIncomeEntry = {
    id: requireString(row, "id"),
    amount: requireFinite(row, "amount", 0),
    date: requireString(row, "date"),
    note: requireString(row, "note"),
    allocations: parseAllocations(row),
  };
  if (parsed.amount <= 0 || !DATE_PATTERN.test(parsed.date)) {
    throw new TypeError("income entry has an invalid amount or date");
  }
  return parsed;
}

function parseExpense(row: unknown): JarExpenseEntry {
  if (!isRecord(row)) throw new TypeError("expense entry must be an object");
  const parsed: JarExpenseEntry = {
    id: requireString(row, "id"),
    jarId: requireString(row, "jarId"),
    amount: requireFinite(row, "amount", 0),
    date: requireString(row, "date"),
    note: requireString(row, "note"),
  };
  if (parsed.amount <= 0 || !DATE_PATTERN.test(parsed.date)) {
    throw new TypeError("expense entry has an invalid amount or date");
  }
  return parsed;
}

function parseTransfer(row: unknown): JarTransferEntry {
  if (!isRecord(row)) throw new TypeError("transfer entry must be an object");
  const parsed: JarTransferEntry = {
    id: requireString(row, "id"),
    fromJarId: requireString(row, "fromJarId"),
    toJarId: requireString(row, "toJarId"),
    amount: requireFinite(row, "amount", 0),
    date: requireString(row, "date"),
    note: requireString(row, "note"),
  };
  if (parsed.amount <= 0 || !DATE_PATTERN.test(parsed.date)) {
    throw new TypeError("transfer entry has an invalid amount or date");
  }
  return parsed;
}

export function parseJarToolState(value: unknown): JarToolPersisted {
  if (!isRecord(value)) {
    throw new TypeError("jar data must be a JSON object");
  }
  return {
    jars: requireArray(value, "jars").map(parseJar),
    incomes: requireArray(value, "incomes").map(parseIncome),
    expenses: requireArray(value, "expenses").map(parseExpense),
    transfers: requireArray(value, "transfers").map(parseTransfer),
  };
}

function newId(): string {
  return crypto.randomUUID();
}

function trimNote(note: string): string {
  return note.trim();
}

export const useJarStore = create<JarToolStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_JAR_STATE,

      addJar: (name) => {
        const id = newId();
        set((state) => ({
          jars: [
            ...state.jars,
            { id, name: name.trim(), allocationPercent: 0 },
          ],
        }));
        return id;
      },

      updateJar: (id, patch) =>
        set((state) => ({
          jars: state.jars.map((jar) =>
            jar.id === id ? { ...jar, ...patch } : jar
          ),
        })),

      removeJar: (id) => {
        const state = get();
        if (isJarReferenced(id, state.incomes, state.expenses, state.transfers)) {
          return;
        }
        set((current) => ({
          jars: current.jars.filter((jar) => jar.id !== id),
        }));
      },

      addIncome: ({ amount, date, note }) => {
        if (!(amount > 0) || !Number.isFinite(amount)) return;
        const jars = get().jars;
        let allocations;
        try {
          allocations = allocateIncome(amount, jars);
        } catch {
          return;
        }
        set((state) => ({
          incomes: [
            {
              id: newId(),
              amount,
              date,
              note: trimNote(note),
              allocations,
            },
            ...state.incomes,
          ],
        }));
      },

      removeIncome: (id) =>
        set((state) => ({
          incomes: state.incomes.filter((entry) => entry.id !== id),
        })),

      addExpense: ({ jarId, amount, date, note }) => {
        if (!(amount > 0) || !Number.isFinite(amount)) return;
        const state = get();
        if (!state.jars.some((jar) => jar.id === jarId)) return;
        const activity = computeJarActivity(
          state.incomes,
          state.expenses,
          state.transfers
        );
        const balance = activity.get(jarId)?.balance ?? 0;
        if (amount > balance + 1e-9) return;
        set((current) => ({
          expenses: [
            {
              id: newId(),
              jarId,
              amount,
              date,
              note: trimNote(note),
            },
            ...current.expenses,
          ],
        }));
      },

      removeExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((entry) => entry.id !== id),
        })),

      addTransfer: ({ fromJarId, toJarId, amount, date, note }) => {
        if (!(amount > 0) || !Number.isFinite(amount)) return;
        if (fromJarId === toJarId) return;
        const state = get();
        const known = (id: string) => state.jars.some((jar) => jar.id === id);
        if (!known(fromJarId) || !known(toJarId)) return;
        const activity = computeJarActivity(
          state.incomes,
          state.expenses,
          state.transfers
        );
        const balance = activity.get(fromJarId)?.balance ?? 0;
        if (amount > balance + 1e-9) return;
        set((current) => ({
          transfers: [
            {
              id: newId(),
              fromJarId,
              toJarId,
              amount,
              date,
              note: trimNote(note),
            },
            ...current.transfers,
          ],
        }));
      },

      removeTransfer: (id) =>
        set((state) => ({
          transfers: state.transfers.filter((entry) => entry.id !== id),
        })),

      replaceAll: (data) => {
        set(parseJarToolState(data));
      },

      reset: () => {
        set(EMPTY_JAR_STATE);
      },
    }),
    {
      name: "finplan:jar:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
