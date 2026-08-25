import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Holding,
  PortfolioToolPersisted,
} from "@/lib/finance/portfolio";

export const PORTFOLIO_EXPORT_SCHEMA_VERSION = 1;

export type { Holding, PortfolioToolPersisted };

interface PortfolioToolActions {
  setHoldings: (holdings: Holding[]) => void;
  addHolding: (holding: Omit<Holding, "id">) => string;
  updateHolding: (id: string, patch: Partial<Omit<Holding, "id">>) => void;
  removeHolding: (id: string) => void;
  setTarget: (assetClass: string, weight: number) => void;
  removeTarget: (assetClass: string) => void;
  replaceAll: (data: unknown) => void;
  reset: () => void;
}

export type PortfolioToolStore = PortfolioToolPersisted & PortfolioToolActions;

export const EMPTY_PORTFOLIO_STATE: PortfolioToolPersisted = {
  holdings: [],
  targets: {},
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: Record<string, unknown>, key: string): string {
  const raw = value[key];
  if (typeof raw !== "string") {
    throw new TypeError(`portfolio export field "${key}" must be a string`);
  }
  return raw;
}

function requireNonNegative(
  value: Record<string, unknown>,
  key: string
): number {
  const raw = value[key];
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
    throw new TypeError(
      `portfolio export field "${key}" must be a finite number >= 0`
    );
  }
  return raw;
}

function parseHolding(row: unknown): Holding {
  if (!isRecord(row)) {
    throw new TypeError("holding entry must be an object");
  }
  return {
    id: requireString(row, "id"),
    symbol: requireString(row, "symbol"),
    name: typeof row.name === "string" ? row.name : "",
    assetClass:
      typeof row.assetClass === "string" && row.assetClass.length > 0
        ? row.assetClass
        : "Uncategorized",
    quantity: requireNonNegative(row, "quantity"),
    price: requireNonNegative(row, "price"),
  };
}

function parseTargets(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const targets: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (key.length > 0 && typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
      targets[key] = Math.min(1, raw);
    }
  }
  return targets;
}

export function parsePortfolioToolState(
  value: unknown
): PortfolioToolPersisted {
  if (!isRecord(value)) {
    throw new TypeError("portfolio data must be a JSON object");
  }
  return {
    holdings: Array.isArray(value.holdings)
      ? value.holdings.map(parseHolding)
      : [],
    targets: parseTargets(value.targets),
  };
}

function newId(): string {
  return crypto.randomUUID();
}

export const usePortfolioStore = create<PortfolioToolStore>()(
  persist(
    (set) => ({
      ...EMPTY_PORTFOLIO_STATE,

      setHoldings: (holdings) => {
        set({ holdings });
      },

      addHolding: (holding) => {
        const id = newId();
        set((state) => ({
          holdings: [...state.holdings, { ...holding, id }],
        }));
        return id;
      },

      updateHolding: (id, patch) =>
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.id === id ? { ...h, ...patch } : h
          ),
        })),

      removeHolding: (id) =>
        set((state) => ({
          holdings: state.holdings.filter((h) => h.id !== id),
        })),

      setTarget: (assetClass, weight) => {
        const key = assetClass.trim();
        if (key.length === 0 || !Number.isFinite(weight)) return;
        const clamped = Math.min(1, Math.max(0, weight));
        set((state) => ({ targets: { ...state.targets, [key]: clamped } }));
      },

      removeTarget: (assetClass) =>
        set((state) => {
          const targets = { ...state.targets };
          delete targets[assetClass];
          return { targets };
        }),

      replaceAll: (data) => {
        set(parsePortfolioToolState(data));
      },

      reset: () => {
        set(EMPTY_PORTFOLIO_STATE);
      },
    }),
    {
      name: "finplan:portfolio:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
