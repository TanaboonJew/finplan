import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const PAY_TOOL_ID = "pay";
export const PAY_SCHEMA_VERSION = 1;

export type BillingCycle = "monthly" | "yearly";

export const BILLING_CYCLES: readonly BillingCycle[] = [
  "monthly",
  "yearly",
] as const;

export interface PriceRecord {
  amount: number;
  effectiveMonth: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: BillingCycle;
  category: string;
  startDate: string;
  renewalDay: number;
  currency: string;
  priceHistory: PriceRecord[];
  active: boolean;
}

export interface PaySnapshot {
  subscriptions: Subscription[];
  currency: string;
}

export interface NewSubscriptionInput
  extends Omit<Subscription, "id" | "priceHistory"> {
  id?: string;
}

interface PayStoreState extends PaySnapshot {
  addSubscription: (input: NewSubscriptionInput) => string;
  updateSubscription: (
    id: string,
    patch: Partial<Omit<Subscription, "id">>
  ) => void;
  removeSubscription: (id: string) => void;
  setCurrency: (currency: string) => void;
  recordPriceIncrease: (
    id: string,
    newAmount: number,
    effectiveMonth: string
  ) => void;
  replaceState: (snapshot: PaySnapshot) => void;
  reset: () => void;
}

const DEFAULT_STATE: PaySnapshot = {
  subscriptions: [],
  currency: "USD",
};

const CURRENCY_PATTERN = /^[A-Za-z]{3}$/;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `pay-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function clampPositive(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

function clampRenewalDay(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 28) return 1;
  return Math.floor(parsed);
}

function sanitizePriceRecord(value: unknown): PriceRecord | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const amount = clampPositive(record.amount);
  if (amount <= 0) return null;
  const effectiveMonth =
    typeof record.effectiveMonth === "string" &&
    MONTH_PATTERN.test(record.effectiveMonth)
      ? record.effectiveMonth
      : null;
  if (effectiveMonth === null) return null;
  return { amount, effectiveMonth };
}

function sanitizeSubscription(value: unknown): Subscription | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name.trim()
      : null;
  if (name === null) return null;

  const amount = clampPositive(record.amount);
  if (amount <= 0) return null;

  const cycle =
    typeof record.cycle === "string" &&
    (record.cycle === "monthly" || record.cycle === "yearly")
      ? (record.cycle as BillingCycle)
      : null;
  if (cycle === null) return null;

  const category =
    typeof record.category === "string" ? record.category.trim() : "";

  const startDate =
    typeof record.startDate === "string" &&
    MONTH_PATTERN.test(record.startDate)
      ? record.startDate
      : null;
  if (startDate === null) return null;

  const renewalDay = clampRenewalDay(record.renewalDay);

  const currency =
    typeof record.currency === "string" &&
    CURRENCY_PATTERN.test(record.currency)
      ? record.currency.toUpperCase()
      : "USD";

  const priceHistoryRaw = Array.isArray(record.priceHistory)
    ? record.priceHistory.map(sanitizePriceRecord).filter(
        (r): r is PriceRecord => r !== null
      )
    : [];

  const priceHistory: PriceRecord[] =
    priceHistoryRaw.length > 0
      ? priceHistoryRaw
      : [{ amount, effectiveMonth: startDate }];

  const active = record.active !== false;

  return {
    id:
      typeof record.id === "string" && record.id.length > 0
        ? record.id
        : createId(),
    name,
    amount,
    cycle,
    category,
    startDate,
    renewalDay,
    currency,
    priceHistory,
    active,
  };
}

export function sanitizePaySnapshot(value: unknown): PaySnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.subscriptions)) return null;

  const subscriptions = record.subscriptions
    .map(sanitizeSubscription)
    .filter((s): s is Subscription => s !== null);

  const currency =
    typeof record.currency === "string" &&
    CURRENCY_PATTERN.test(record.currency)
      ? record.currency.toUpperCase()
      : DEFAULT_STATE.currency;

  return { subscriptions, currency };
}

function normalizeCurrency(currency: string): string {
  return CURRENCY_PATTERN.test(currency)
    ? currency.toUpperCase()
    : DEFAULT_STATE.currency;
}

export const usePayStore = create<PayStoreState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      addSubscription: (input) => {
        const id = input.id ?? createId();
        const priceHistory: PriceRecord[] = [
          { amount: input.amount, effectiveMonth: input.startDate },
        ];
        set((state) => ({
          subscriptions: [
            ...state.subscriptions,
            {
              id,
              name: input.name,
              amount: input.amount,
              cycle: input.cycle,
              category: input.category,
              startDate: input.startDate,
              renewalDay: input.renewalDay,
              currency: input.currency ?? state.currency,
              priceHistory,
              active: input.active,
            },
          ],
        }));
        return id;
      },
      updateSubscription: (id, patch) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, ...patch } : sub
          ),
        })),
      removeSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
        })),
      setCurrency: (currency) => set({ currency: normalizeCurrency(currency) }),
      recordPriceIncrease: (id, newAmount, effectiveMonth) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
            if (sub.id !== id) return sub;
            const amount = clampPositive(newAmount);
            if (amount <= 0) return sub;
            return {
              ...sub,
              amount,
              priceHistory: [
                ...sub.priceHistory,
                { amount, effectiveMonth },
              ],
            };
          }),
        })),
      replaceState: (snapshot) =>
        set({
          ...snapshot,
          currency: normalizeCurrency(snapshot.currency),
        }),
      reset: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "finplan:pay:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => sanitizePaySnapshot(persisted) ?? DEFAULT_STATE,
    }
  )
);
