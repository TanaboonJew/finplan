import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const RETIREMENT_TOOL_ID = "retirement";
export const RETIREMENT_SCHEMA_VERSION = 1;

export interface RetirementSnapshot {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  annualReturnRate: number;
  inflationRate: number;
  desiredRetirementIncome: number;
  withdrawalRate: number;
  currency: string;
}

interface RetirementStoreState extends RetirementSnapshot {
  setCurrentAge: (age: number) => void;
  setRetirementAge: (age: number) => void;
  setCurrentSavings: (value: number | null) => void;
  setMonthlyContribution: (value: number | null) => void;
  setAnnualReturnRate: (rate: number) => void;
  setInflationRate: (rate: number) => void;
  setDesiredRetirementIncome: (value: number | null) => void;
  setWithdrawalRate: (rate: number) => void;
  setCurrency: (currency: string) => void;
  replaceState: (snapshot: RetirementSnapshot) => void;
  reset: () => void;
}

export const DEFAULT_RETIREMENT_STATE: RetirementSnapshot = {
  currentAge: 32,
  retirementAge: 65,
  currentSavings: 40000,
  monthlyContribution: 800,
  annualReturnRate: 0.07,
  inflationRate: 0.03,
  desiredRetirementIncome: 48000,
  withdrawalRate: 0.04,
  currency: "USD",
};

export const MAX_AGE = 120;
export const MIN_WITHDRAWAL_RATE = 0.005;
export const MAX_WITHDRAWAL_RATE = 0.2;

const CURRENCY_PATTERN = /^[A-Za-z]{3}$/;

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

function clampRate(value: unknown, max: number): number {
  return clampNumber(value, 0, max);
}

export function sanitizeRetirementSnapshot(
  value: unknown
): RetirementSnapshot | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;

  const currency =
    typeof record.currency === "string" &&
    CURRENCY_PATTERN.test(record.currency)
      ? record.currency.toUpperCase()
      : DEFAULT_RETIREMENT_STATE.currency;

  return {
    currentAge: Math.round(clampNumber(record.currentAge, 0, MAX_AGE)),
    retirementAge: Math.round(clampNumber(record.retirementAge, 0, MAX_AGE)),
    currentSavings: clampMoney(record.currentSavings),
    monthlyContribution: clampMoney(record.monthlyContribution),
    annualReturnRate: clampRate(record.annualReturnRate, 0.5),
    inflationRate: clampRate(record.inflationRate, 0.5),
    desiredRetirementIncome: clampMoney(record.desiredRetirementIncome),
    withdrawalRate: clampNumber(
      record.withdrawalRate,
      MIN_WITHDRAWAL_RATE,
      MAX_WITHDRAWAL_RATE
    ),
    currency,
  };
}

function normalizeCurrency(currency: string): string {
  return CURRENCY_PATTERN.test(currency)
    ? currency.toUpperCase()
    : DEFAULT_RETIREMENT_STATE.currency;
}

function moneyOrNull(value: number | null): number {
  if (value === null || !Number.isFinite(value) || value < 0) return 0;
  return value;
}

export const useRetirementStore = create<RetirementStoreState>()(
  persist(
    (set) => ({
      ...DEFAULT_RETIREMENT_STATE,
      setCurrentAge: (age) =>
        set({ currentAge: Math.round(clampNumber(age, 0, MAX_AGE)) }),
      setRetirementAge: (age) =>
        set({ retirementAge: Math.round(clampNumber(age, 0, MAX_AGE)) }),
      setCurrentSavings: (value) =>
        set({ currentSavings: moneyOrNull(value) }),
      setMonthlyContribution: (value) =>
        set({ monthlyContribution: moneyOrNull(value) }),
      setAnnualReturnRate: (rate) =>
        set({ annualReturnRate: clampRate(rate, 0.5) }),
      setInflationRate: (rate) => set({ inflationRate: clampRate(rate, 0.5) }),
      setDesiredRetirementIncome: (value) =>
        set({ desiredRetirementIncome: moneyOrNull(value) }),
      setWithdrawalRate: (rate) =>
        set({
          withdrawalRate: clampNumber(
            rate,
            MIN_WITHDRAWAL_RATE,
            MAX_WITHDRAWAL_RATE
          ),
        }),
      setCurrency: (currency) =>
        set({ currency: normalizeCurrency(currency) }),
      replaceState: (snapshot) =>
        set({
          ...snapshot,
          currency: normalizeCurrency(snapshot.currency),
        }),
      reset: () => set({ ...DEFAULT_RETIREMENT_STATE }),
    }),
    {
      name: "finplan:retirement:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) =>
        sanitizeRetirementSnapshot(persisted) ?? DEFAULT_RETIREMENT_STATE,
    }
  )
);
