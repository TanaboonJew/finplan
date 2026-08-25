import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const DCA_TOOL_ID = "dca";
export const DCA_SCHEMA_VERSION = 1;

export interface DcaFundInput {
  id: string;
  name: string;
  expenseRatio: number;
  frontLoad: number;
  exitLoad: number;
  annualReturn: number;
}

export interface DcaToolPersisted {
  funds: DcaFundInput[];
  monthlyContribution: number;
  horizonMonths: number;
  currency: string;
}

interface DcaToolActions {
  setFunds: (funds: DcaFundInput[]) => void;
  addFund: (fund: DcaFundInput) => void;
  updateFund: (id: string, patch: Partial<Omit<DcaFundInput, "id">>) => void;
  removeFund: (id: string) => void;
  setMonthlyContribution: (amount: number) => void;
  setHorizonMonths: (months: number) => void;
  setCurrency: (currency: string) => void;
  replaceState: (snapshot: DcaToolPersisted) => void;
  reset: () => void;
}

export type DcaToolStore = DcaToolPersisted & DcaToolActions;

const DEFAULT_STATE: DcaToolPersisted = {
  funds: [],
  monthlyContribution: 0,
  horizonMonths: 360,
  currency: "USD",
};

const CURRENCY_PATTERN = /^[A-Za-z]{3}$/;

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `dca-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function clampNonNegative(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function clampPositive(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return parsed;
}

function sanitizeFundInput(value: unknown): DcaFundInput | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name.trim()
      : null;
  if (name === null) return null;
  return {
    id:
      typeof record.id === "string" && record.id.length > 0
        ? record.id
        : createId(),
    name,
    expenseRatio: clampNonNegative(record.expenseRatio),
    frontLoad: clampNonNegative(record.frontLoad),
    exitLoad: clampNonNegative(record.exitLoad),
    annualReturn: clampNonNegative(record.annualReturn),
  };
}

export function sanitizeDcaToolPersisted(
  value: unknown
): DcaToolPersisted | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;

  if (!Array.isArray(record.funds)) return null;
  const funds = (record.funds as unknown[])
    .map(sanitizeFundInput)
    .filter((f): f is DcaFundInput => f !== null);

  const monthlyContribution = clampPositive(record.monthlyContribution);
  const horizonMonths = Math.max(
    1,
    Math.min(600, Math.round(clampPositive(record.horizonMonths)))
  );
  const currency =
    typeof record.currency === "string" &&
    CURRENCY_PATTERN.test(record.currency)
      ? record.currency.toUpperCase()
      : DEFAULT_STATE.currency;

  return { funds, monthlyContribution, horizonMonths, currency };
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

export function createDefaultFund(): DcaFundInput {
  return {
    id: createId(),
    name: "",
    expenseRatio: 0,
    frontLoad: 0,
    exitLoad: 0,
    annualReturn: 0,
  };
}

export const useDcaStore = create<DcaToolStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setFunds: (funds) => set({ funds }),
      addFund: (fund) =>
        set((state) => ({ funds: [...state.funds, fund] })),
      updateFund: (id, patch) =>
        set((state) => ({
          funds: state.funds.map((f) =>
            f.id === id ? { ...f, ...patch } : f
          ),
        })),
      removeFund: (id) =>
        set((state) => ({
          funds: state.funds.filter((f) => f.id !== id),
        })),
      setMonthlyContribution: (amount) =>
        set({ monthlyContribution: Math.max(0, amount) }),
      setHorizonMonths: (months) =>
        set({ horizonMonths: Math.max(1, Math.min(600, Math.round(months))) }),
      setCurrency: (currency) =>
        set({ currency: normalizeCurrency(currency) }),
      replaceState: (snapshot) =>
        set({
          ...snapshot,
          currency: normalizeCurrency(snapshot.currency),
        }),
      reset: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "finplan:dca:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) =>
        sanitizeDcaToolPersisted(persisted) ?? DEFAULT_STATE,
    }
  )
);
