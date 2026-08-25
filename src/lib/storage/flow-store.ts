import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FlowStream, WhatIfAdjustment } from "@/lib/finance/flow";

export const FLOW_TOOL_ID = "flow";
export const FLOW_SCHEMA_VERSION = 1;

export interface FlowSnapshot {
  streams: FlowStream[];
  startingBalance: number;
  horizonMonths: number;
  currency: string;
}

export interface FlowState extends FlowSnapshot {
  whatIfAdjustments: WhatIfAdjustment[];
  addStream: (stream: Omit<FlowStream, "id"> & { id?: string }) => string;
  updateStream: (id: string, patch: Partial<Omit<FlowStream, "id">>) => void;
  removeStream: (id: string) => void;
  setStartingBalance: (value: number) => void;
  setHorizonMonths: (value: number) => void;
  setCurrency: (currency: string) => void;
  setWhatIfAdjustments: (adjustments: WhatIfAdjustment[]) => void;
  resetWhatIf: () => void;
  replaceState: (snapshot: FlowSnapshot) => void;
  reset: () => void;
}

const DEFAULT_STATE: FlowSnapshot = {
  streams: [],
  startingBalance: 0,
  horizonMonths: 12,
  currency: "USD",
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
  return `flow-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function clampNonNegative(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function clampHorizon(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 12;
  return Math.min(120, Math.max(1, Math.round(parsed)));
}

function normalizeCurrency(currency: string): string {
  return CURRENCY_PATTERN.test(currency) ? currency.toUpperCase() : DEFAULT_STATE.currency;
}

function sanitizeStream(value: unknown): FlowStream | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name.trim()
      : null;
  if (name === null) return null;

  const category =
    record.category === "income" || record.category === "expense"
      ? record.category
      : "expense";

  const startMonth =
    typeof record.startMonth === "string" && MONTH_PATTERN.test(record.startMonth)
      ? record.startMonth
      : null;
  if (startMonth === null) return null;

  const endMonth =
    typeof record.endMonth === "string" && MONTH_PATTERN.test(record.endMonth)
      ? record.endMonth
      : null;

  return {
    id:
      typeof record.id === "string" && record.id.length > 0
        ? record.id
        : createId(),
    name,
    amount: clampNonNegative(record.amount),
    category,
    startMonth,
    endMonth,
  };
}

export function sanitizeFlowSnapshot(value: unknown): FlowSnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.streams)) return null;

  const streams = record.streams
    .map(sanitizeStream)
    .filter((s): s is FlowStream => s !== null);

  const currency =
    typeof record.currency === "string" && CURRENCY_PATTERN.test(record.currency)
      ? record.currency.toUpperCase()
      : DEFAULT_STATE.currency;

  const horizonMonths = clampHorizon(record.horizonMonths);

  return {
    streams,
    startingBalance: clampNonNegative(record.startingBalance),
    horizonMonths,
    currency,
  };
}

export const currentMonth = (date: Date = new Date()): string => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};

export const useFlowStore = create<FlowState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      whatIfAdjustments: [],
      addStream: (input) => {
        const id = input.id ?? createId();
        set((state) => ({
          streams: [
            ...state.streams,
            {
              id,
              name: input.name,
              amount: input.amount,
              category: input.category,
              startMonth: input.startMonth,
              endMonth: input.endMonth,
            },
          ],
        }));
        return id;
      },
      updateStream: (id, patch) =>
        set((state) => ({
          streams: state.streams.map((s) =>
            s.id === id ? { ...s, ...patch } : s
          ),
        })),
      removeStream: (id) =>
        set((state) => ({
          streams: state.streams.filter((s) => s.id !== id),
        })),
      setStartingBalance: (value) =>
        set({ startingBalance: clampNonNegative(value) }),
      setHorizonMonths: (value) => set({ horizonMonths: clampHorizon(value) }),
      setCurrency: (currency) => set({ currency: normalizeCurrency(currency) }),
      setWhatIfAdjustments: (adjustments) =>
        set({ whatIfAdjustments: adjustments }),
      resetWhatIf: () => set({ whatIfAdjustments: [] }),
      replaceState: (snapshot) =>
        set({
          ...snapshot,
          currency: normalizeCurrency(snapshot.currency),
          whatIfAdjustments: [],
        }),
      reset: () => set({ ...DEFAULT_STATE, whatIfAdjustments: [] }),
    }),
    {
      name: "finplan:flow:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => sanitizeFlowSnapshot(persisted) ?? DEFAULT_STATE,
    }
  )
);
