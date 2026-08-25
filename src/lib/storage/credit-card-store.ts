import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  CreditCardInput,
  RewardRate,
  RewardType,
  SpendCategory,
} from "@/lib/finance/credit-card";

export interface SpendProfile {
  name: string;
  categories: SpendCategory[];
}

export interface CreditCardToolPersisted {
  cards: CreditCardInput[];
  profiles: SpendProfile[];
  activeProfileIndex: number;
}

export const CREDIT_CARD_EXPORT_SCHEMA_VERSION = 1;

interface CreditCardToolActions {
  addCard: (card: Omit<CreditCardInput, "id">) => string;
  updateCard: (id: string, patch: Partial<Omit<CreditCardInput, "id">>) => void;
  removeCard: (id: string) => void;
  addProfile: (name: string) => string;
  updateProfile: (
    index: number,
    patch: Partial<Pick<SpendProfile, "name" | "categories">>
  ) => void;
  removeProfile: (index: number) => void;
  setActiveProfileIndex: (index: number) => void;
  replaceAll: (data: unknown) => void;
  reset: () => void;
}

export type CreditCardToolStore = CreditCardToolPersisted & CreditCardToolActions;

export const EMPTY_CREDIT_CARD_STATE: CreditCardToolPersisted = {
  cards: [],
  profiles: [],
  activeProfileIndex: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: Record<string, unknown>, key: string): string {
  const raw = value[key];
  if (typeof raw !== "string") {
    throw new TypeError(`credit-card export field "${key}" must be a string`);
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
      `credit-card export field "${key}" must be a finite number >= ${minimum}`
    );
  }
  return raw;
}

function parseRewardType(value: unknown): RewardType {
  if (value !== "cashback" && value !== "points" && value !== "miles") {
    throw new TypeError(
      'credit-card rewardType must be "cashback", "points", or "miles"'
    );
  }
  return value;
}

function parseRewardRate(row: unknown): RewardRate {
  if (!isRecord(row)) throw new TypeError("rewardRate must be an object");
  return {
    categoryId: requireString(row, "categoryId"),
    rate: requireFinite(row, "rate", 0),
  };
}

function parseCreditCard(row: unknown): CreditCardInput {
  if (!isRecord(row)) throw new TypeError("credit card must be an object");
  return {
    id: requireString(row, "id"),
    name: requireString(row, "name"),
    network: requireString(row, "network"),
    annualFee: requireFinite(row, "annualFee", 0),
    foreignFee: requireFinite(row, "foreignFee", 0),
    apr: requireFinite(row, "apr", 0),
    rewardType: parseRewardType(row.rewardType),
    rewardRates: Array.isArray(row.rewardRates)
      ? row.rewardRates.map(parseRewardRate)
      : [],
    signupBonus: requireFinite(row, "signupBonus", 0),
    pointValue: requireFinite(row, "pointValue", 0),
    notes: typeof row.notes === "string" ? row.notes : "",
  };
}

function parseSpendCategory(row: unknown): SpendCategory {
  if (!isRecord(row)) throw new TypeError("spendCategory must be an object");
  return {
    id: requireString(row, "id"),
    name: requireString(row, "name"),
    annualSpend: requireFinite(row, "annualSpend", 0),
  };
}

function parseSpendProfile(row: unknown): SpendProfile {
  if (!isRecord(row)) throw new TypeError("spend profile must be an object");
  return {
    name: requireString(row, "name"),
    categories: Array.isArray(row.categories)
      ? row.categories.map(parseSpendCategory)
      : [],
  };
}

export function parseCreditCardToolState(
  value: unknown
): CreditCardToolPersisted {
  if (!isRecord(value)) {
    throw new TypeError("credit-card data must be a JSON object");
  }
  const cards = Array.isArray(value.cards)
    ? value.cards.map(parseCreditCard)
    : [];
  const profiles = Array.isArray(value.profiles)
    ? value.profiles.map(parseSpendProfile)
    : [];
  const activeProfileIndex =
    typeof value.activeProfileIndex === "number" &&
    value.activeProfileIndex >= 0 &&
    value.activeProfileIndex < profiles.length
      ? value.activeProfileIndex
      : 0;
  return { cards, profiles, activeProfileIndex };
}

function newId(): string {
  return crypto.randomUUID();
}

export const useCreditCardStore = create<CreditCardToolStore>()(
  persist(
    (set) => ({
      ...EMPTY_CREDIT_CARD_STATE,

      addCard: (card) => {
        const id = newId();
        set((state) => ({
          cards: [...state.cards, { ...card, id }],
        }));
        return id;
      },

      updateCard: (id, patch) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id ? { ...card, ...patch } : card
          ),
        })),

      removeCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
        })),

      addProfile: (name) => {
        const index = 0;
        set((state) => ({
          profiles: [
            ...state.profiles,
            { name: name.trim() || "New profile", categories: [] },
          ],
        }));
        return String(index);
      },

      updateProfile: (index, patch) =>
        set((state) => ({
          profiles: state.profiles.map((profile, i) =>
            i === index ? { ...profile, ...patch } : profile
          ),
        })),

      removeProfile: (index) =>
        set((state) => {
          const profiles = state.profiles.filter((_, i) => i !== index);
          const activeProfileIndex =
            state.activeProfileIndex >= profiles.length
              ? Math.max(0, profiles.length - 1)
              : state.activeProfileIndex;
          return { profiles, activeProfileIndex };
        }),

      setActiveProfileIndex: (index) => set({ activeProfileIndex: index }),

      replaceAll: (data) => {
        set(parseCreditCardToolState(data));
      },

      reset: () => {
        set(EMPTY_CREDIT_CARD_STATE);
      },
    }),
    {
      name: "finplan:credit-card:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
