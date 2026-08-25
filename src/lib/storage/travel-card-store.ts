import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const TRAVEL_CARD_TOOL_ID = "travel-card";
export const TRAVEL_CARD_SCHEMA_VERSION = 1;

export interface TravelCardInput {
  id: string;
  name: string;
  annualFee: number;
  fxFeePercent: number;
  fxMarkupPercent: number;
  rewardForeignPercent: number;
  rewardDomesticPercent: number;
  atmFeeFlat: number;
}

export interface TripParams {
  foreignSpend: number;
  daysAbroad: number;
  homeCurrency: string;
  destinationCurrency: string;
  vatRate: number;
  vatMinSpend: number;
  enableVatRefund: boolean;
}

export interface TravelCardToolPersisted {
  cards: TravelCardInput[];
  trip: TripParams;
}

interface TravelCardToolActions {
  setCards: (cards: TravelCardInput[]) => void;
  addCard: (card: TravelCardInput) => void;
  updateCard: (id: string, patch: Partial<Omit<TravelCardInput, "id">>) => void;
  removeCard: (id: string) => void;
  setTrip: (trip: TripParams) => void;
  replaceState: (snapshot: TravelCardToolPersisted) => void;
  reset: () => void;
}

export type TravelCardToolStore = TravelCardToolPersisted & TravelCardToolActions;

const DEFAULT_STATE: TravelCardToolPersisted = {
  cards: [],
  trip: {
    foreignSpend: 0,
    daysAbroad: 14,
    homeCurrency: "USD",
    destinationCurrency: "EUR",
    vatRate: 0.2,
    vatMinSpend: 75.01,
    enableVatRefund: true,
  },
};

const CURRENCY_PATTERN = /^[A-Za-z]{3}$/;

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `tc-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
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

function clampRate(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

function normalizeCurrency(currency: string): string {
  return CURRENCY_PATTERN.test(currency)
    ? currency.toUpperCase()
    : "USD";
}

function sanitizeCardInput(value: unknown): TravelCardInput | null {
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
    annualFee: clampNonNegative(record.annualFee),
    fxFeePercent: clampRate(record.fxFeePercent),
    fxMarkupPercent: clampRate(record.fxMarkupPercent),
    rewardForeignPercent: clampRate(record.rewardForeignPercent),
    rewardDomesticPercent: clampRate(record.rewardDomesticPercent),
    atmFeeFlat: clampNonNegative(record.atmFeeFlat),
  };
}

function sanitizeTripParams(value: unknown): TripParams {
  if (typeof value !== "object" || value === null) {
    return DEFAULT_STATE.trip;
  }
  const record = value as Record<string, unknown>;
  return {
    foreignSpend: clampNonNegative(record.foreignSpend),
    daysAbroad: Math.max(1, Math.round(clampPositive(record.daysAbroad))),
    homeCurrency: normalizeCurrency(
      typeof record.homeCurrency === "string" ? record.homeCurrency : "USD"
    ),
    destinationCurrency: normalizeCurrency(
      typeof record.destinationCurrency === "string"
        ? record.destinationCurrency
        : "EUR"
    ),
    vatRate: clampRate(record.vatRate),
    vatMinSpend: clampNonNegative(record.vatMinSpend),
    enableVatRefund:
      typeof record.enableVatRefund === "boolean"
        ? record.enableVatRefund
        : true,
  };
}

export function sanitizeTravelCardToolPersisted(
  value: unknown
): TravelCardToolPersisted | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;

  if (!Array.isArray(record.cards)) return null;
  const cards = (record.cards as unknown[])
    .map(sanitizeCardInput)
    .filter((c): c is TravelCardInput => c !== null);

  const trip = sanitizeTripParams(record.trip);

  return { cards, trip };
}

export function currentMonth(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

export function createDefaultCard(): TravelCardInput {
  return {
    id: createId(),
    name: "",
    annualFee: 0,
    fxFeePercent: 0,
    fxMarkupPercent: 0,
    rewardForeignPercent: 0,
    rewardDomesticPercent: 0,
    atmFeeFlat: 0,
  };
}

export const useTravelCardStore = create<TravelCardToolStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setCards: (cards) => set({ cards }),
      addCard: (card) =>
        set((state) => ({ cards: [...state.cards, card] })),
      updateCard: (id, patch) =>
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),
      removeCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== id),
        })),
      setTrip: (trip) => set({ trip }),
      replaceState: (snapshot) =>
        set({
          ...snapshot,
          trip: sanitizeTripParams(snapshot.trip),
        }),
      reset: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "finplan:travel-card:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) =>
        sanitizeTravelCardToolPersisted(persisted) ?? DEFAULT_STATE,
    }
  )
);
