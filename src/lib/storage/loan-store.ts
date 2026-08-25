import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const LOAN_TOOL_ID = "loan";
export const LOAN_SCHEMA_VERSION = 1;

export interface LoanInput {
  id: string;
  name: string;
  principal: number;
  annualRate: number;
  termMonths: number;
}

export interface RefinanceInput {
  newAnnualRate: number;
  closingCost: number;
  newTermMonths: number;
}

export interface LoanToolPersisted {
  loan: LoanInput | null;
  refinance: RefinanceInput | null;
  currency: string;
  startMonth: string | null;
}

interface LoanToolActions {
  setLoan: (loan: LoanInput) => void;
  setRefinance: (refinance: RefinanceInput) => void;
  clearRefinance: () => void;
  setCurrency: (currency: string) => void;
  setStartMonth: (month: string | null) => void;
  replaceState: (snapshot: LoanToolPersisted) => void;
  reset: () => void;
}

export type LoanToolStore = LoanToolPersisted & LoanToolActions;

const DEFAULT_STATE: LoanToolPersisted = {
  loan: null,
  refinance: null,
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
  return `loan-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function clampPositive(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return parsed;
}

function clampNonNegative(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function sanitizeLoanInput(value: unknown): LoanInput | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name.trim()
      : null;
  if (name === null) return null;
  const principal = clampPositive(record.principal);
  const annualRate = clampNonNegative(record.annualRate);
  const termMonths = Math.max(1, Math.round(clampPositive(record.termMonths)));
  return {
    id:
      typeof record.id === "string" && record.id.length > 0
        ? record.id
        : createId(),
    name,
    principal,
    annualRate,
    termMonths,
  };
}

function sanitizeRefinanceInput(value: unknown): RefinanceInput | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const newAnnualRate = clampNonNegative(record.newAnnualRate);
  const closingCost = clampNonNegative(record.closingCost);
  const newTermMonths = Math.max(1, Math.round(clampPositive(record.newTermMonths)));
  return { newAnnualRate, closingCost, newTermMonths };
}

export function sanitizeLoanToolPersisted(
  value: unknown
): LoanToolPersisted | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;

  const loan =
    record.loan === null ? null : sanitizeLoanInput(record.loan);
  if (record.loan !== null && loan === null) return null;

  const refinance =
    record.refinance === null
      ? null
      : sanitizeRefinanceInput(record.refinance);

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

  return { loan, refinance, currency, startMonth };
}

function normalizeCurrency(currency: string): string {
  return CURRENCY_PATTERN.test(currency)
    ? currency.toUpperCase()
    : DEFAULT_STATE.currency;
}

export function currentMonth(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

export function createDefaultLoanInput(): LoanInput {
  return {
    id: createId(),
    name: "",
    principal: 0,
    annualRate: 0,
    termMonths: 12,
  };
}

export const useLoanStore = create<LoanToolStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setLoan: (loan) => set({ loan }),
      setRefinance: (refinance) => set({ refinance }),
      clearRefinance: () => set({ refinance: null }),
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
      name: "finplan:loan:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) =>
        sanitizeLoanToolPersisted(persisted) ?? DEFAULT_STATE,
    }
  )
);
