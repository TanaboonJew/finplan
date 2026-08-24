import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  PAYOFF_STRATEGIES,
  type PayoffStrategy,
} from "@/lib/finance/payoff";

export const DEBT_TOOL_ID = "debt";
export const DEBT_SCHEMA_VERSION = 1;

export interface DebtInput {
  id: string;
  name: string;
  balance: number;
  annualRate: number;
  minimumPayment: number;
}

export interface DebtSnapshot {
  debts: DebtInput[];
  strategy: PayoffStrategy;
  extraMonthlyPayment: number;
  currency: string;
  startMonth: string | null;
}

export interface NewDebtInput extends Omit<DebtInput, "id"> {
  id?: string;
}

interface DebtStoreState extends DebtSnapshot {
  addDebt: (input: NewDebtInput) => string;
  updateDebt: (id: string, patch: Partial<Omit<DebtInput, "id">>) => void;
  removeDebt: (id: string) => void;
  setStrategy: (strategy: PayoffStrategy) => void;
  setExtraMonthlyPayment: (value: number) => void;
  setCurrency: (currency: string) => void;
  setStartMonth: (month: string | null) => void;
  replaceState: (snapshot: DebtSnapshot) => void;
  reset: () => void;
}

const DEFAULT_STATE: DebtSnapshot = {
  debts: [],
  strategy: "snowball",
  extraMonthlyPayment: 0,
  currency: "USD",
  startMonth: null,
};

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const CURRENCY_PATTERN = /^[A-Za-z]{3}$/;

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `debt-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function clampNonNegative(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function sanitizeDebt(value: unknown): DebtInput | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name.trim()
      : null;
  if (name === null) return null;
  const annualRateRaw =
    typeof record.annualRate === "number" ? record.annualRate : Number(record.annualRate);
  return {
    id:
      typeof record.id === "string" && record.id.length > 0
        ? record.id
        : createId(),
    name,
    balance: clampNonNegative(record.balance),
    annualRate:
      Number.isFinite(annualRateRaw) && annualRateRaw >= 0
        ? annualRateRaw
        : 0,
    minimumPayment: clampNonNegative(record.minimumPayment),
  };
}

export function sanitizeDebtSnapshot(value: unknown): DebtSnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.debts)) return null;

  const debts = record.debts
    .map(sanitizeDebt)
    .filter((debt): debt is DebtInput => debt !== null);

  const strategy =
    typeof record.strategy === "string" &&
    PAYOFF_STRATEGIES.includes(record.strategy as PayoffStrategy)
      ? (record.strategy as PayoffStrategy)
      : DEFAULT_STATE.strategy;

  const currency =
    typeof record.currency === "string" &&
    CURRENCY_PATTERN.test(record.currency)
      ? record.currency.toUpperCase()
      : DEFAULT_STATE.currency;

  const startMonth =
    typeof record.startMonth === "string" &&
    MONTH_PATTERN.test(record.startMonth)
      ? record.startMonth
      : null;

  return {
    debts,
    strategy,
    extraMonthlyPayment: clampNonNegative(record.extraMonthlyPayment),
    currency,
    startMonth,
  };
}

function normalizeCurrency(currency: string): string {
  return CURRENCY_PATTERN.test(currency) ? currency.toUpperCase() : DEFAULT_STATE.currency;
}

export function currentMonth(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

export const useDebtStore = create<DebtStoreState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      addDebt: (input) => {
        const id = input.id ?? createId();
        set((state) => ({
          debts: [
            ...state.debts,
            {
              id,
              name: input.name,
              balance: input.balance,
              annualRate: input.annualRate,
              minimumPayment: input.minimumPayment,
            },
          ],
        }));
        return id;
      },
      updateDebt: (id, patch) =>
        set((state) => ({
          debts: state.debts.map((debt) =>
            debt.id === id ? { ...debt, ...patch } : debt
          ),
        })),
      removeDebt: (id) =>
        set((state) => ({
          debts: state.debts.filter((debt) => debt.id !== id),
        })),
      setStrategy: (strategy) => set({ strategy }),
      setExtraMonthlyPayment: (value) =>
        set({ extraMonthlyPayment: clampNonNegative(value) }),
      setCurrency: (currency) => set({ currency: normalizeCurrency(currency) }),
      setStartMonth: (month) => set({ startMonth: month }),
      replaceState: (snapshot) =>
        set({
          ...snapshot,
          currency: normalizeCurrency(snapshot.currency),
        }),
      reset: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "finplan:debt:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => sanitizeDebtSnapshot(persisted) ?? DEFAULT_STATE,
    }
  )
);
