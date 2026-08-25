import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  type Achievement,
  type AchievementId,
  type Building,
  type BuildingColor,
  type BuildingIcon,
  type Deposit,
  type KingdomToolPersisted,
  evaluateAchievements,
} from "@/lib/finance/kingdom";

export const KINGDOM_EXPORT_SCHEMA_VERSION = 1;

export type { KingdomToolPersisted };

interface KingdomToolActions {
  setKingdomName: (name: string) => void;
  addBuilding: (building: {
    name: string;
    icon: BuildingIcon;
    targetAmount: number;
    color: BuildingColor;
  }) => string;
  updateBuilding: (
    id: string,
    patch: Partial<Pick<Building, "name" | "targetAmount" | "icon" | "color">>
  ) => void;
  removeBuilding: (id: string) => void;
  addDeposit: (entry: {
    buildingId: string;
    amount: number;
    date: string;
    note: string;
  }) => void;
  removeDeposit: (id: string) => void;
  replaceAll: (data: unknown) => void;
  reset: () => void;
}

export type KingdomToolStore = KingdomToolPersisted & KingdomToolActions;

export const EMPTY_KINGDOM_STATE: KingdomToolPersisted = {
  kingdomName: "My Kingdom",
  buildings: [],
  deposits: [],
  achievements: [],
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VALID_ICONS: readonly string[] = ["tower", "house", "castle", "hut", "temple", "bridge"];
const VALID_COLORS: readonly string[] = ["emerald", "blue", "amber", "rose", "violet", "cyan"];
const VALID_ACHIEVEMENT_IDS: readonly string[] = [
  "first_deposit",
  "first_building",
  "half_funded",
  "first_complete",
  "five_buildings",
  "thousand_club",
  "five_achievements",
  "kingdom_complete",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: Record<string, unknown>, key: string): string {
  const raw = value[key];
  if (typeof raw !== "string") {
    throw new TypeError(`kingdom export field "${key}" must be a string`);
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
      `kingdom export field "${key}" must be a finite number >= ${minimum}`
    );
  }
  return raw;
}

function requireArray(value: Record<string, unknown>, key: string): unknown[] {
  const raw = value[key];
  if (!Array.isArray(raw)) {
    throw new TypeError(`kingdom export field "${key}" must be an array`);
  }
  return raw;
}

function parseBuilding(row: unknown): Building {
  if (!isRecord(row)) throw new TypeError("building entry must be an object");
  const icon = requireString(row, "icon");
  if (!VALID_ICONS.includes(icon)) {
    throw new TypeError(`building icon must be one of: ${VALID_ICONS.join(", ")}`);
  }
  const color = requireString(row, "color");
  if (!VALID_COLORS.includes(color)) {
    throw new TypeError(`building color must be one of: ${VALID_COLORS.join(", ")}`);
  }
  const targetAmount = requireFinite(row, "targetAmount", 0.01);
  const currentAmount = requireFinite(row, "currentAmount", 0);
  if (currentAmount > targetAmount + 1e-9) {
    throw new TypeError("currentAmount cannot exceed targetAmount");
  }
  return {
    id: requireString(row, "id"),
    name: requireString(row, "name"),
    icon: icon as BuildingIcon,
    targetAmount,
    currentAmount,
    color: color as BuildingColor,
    createdAt: requireString(row, "createdAt"),
  };
}

function parseDeposit(row: unknown): Deposit {
  if (!isRecord(row)) throw new TypeError("deposit entry must be an object");
  const amount = requireFinite(row, "amount", 0.01);
  const date = requireString(row, "date");
  if (!DATE_PATTERN.test(date)) {
    throw new TypeError("deposit date must be YYYY-MM-DD");
  }
  return {
    id: requireString(row, "id"),
    buildingId: requireString(row, "buildingId"),
    amount,
    date,
    note: requireString(row, "note"),
  };
}

function parseAchievement(row: unknown): Achievement {
  if (!isRecord(row)) throw new TypeError("achievement entry must be an object");
  const id = requireString(row, "id");
  if (!VALID_ACHIEVEMENT_IDS.includes(id)) {
    throw new TypeError(`unknown achievement id: ${id}`);
  }
  const raw = row.unlockedAt;
  if (raw !== null && typeof raw !== "string") {
    throw new TypeError("achievement unlockedAt must be null or string");
  }
  return { id: id as AchievementId, unlockedAt: raw as string | null };
}

export function parseKingdomToolState(value: unknown): KingdomToolPersisted {
  if (!isRecord(value)) {
    throw new TypeError("kingdom data must be a JSON object");
  }
  return {
    kingdomName: typeof value.kingdomName === "string" ? value.kingdomName : "My Kingdom",
    buildings: requireArray(value, "buildings").map(parseBuilding),
    deposits: requireArray(value, "deposits").map(parseDeposit),
    achievements: requireArray(value, "achievements").map(parseAchievement),
  };
}

function newId(): string {
  return crypto.randomUUID();
}

function trimNote(note: string): string {
  return note.trim();
}

export const useKingdomStore = create<KingdomToolStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_KINGDOM_STATE,

      setKingdomName: (name) =>
        set({ kingdomName: name.trim() || "My Kingdom" }),

      addBuilding: ({ name, icon, targetAmount, color }) => {
        if (!(targetAmount > 0) || !Number.isFinite(targetAmount)) return "";
        const trimmed = name.trim();
        if (!trimmed) return "";
        const state = get();
        if (state.buildings.length >= 12) return "";
        const id = newId();
        const now = new Date().toISOString().slice(0, 10);
        set((current) => ({
          buildings: [
            ...current.buildings,
            {
              id,
              name: trimmed,
              icon,
              targetAmount,
              currentAmount: 0,
              color,
              createdAt: now,
            },
          ],
        }));
        const updated = get();
        const newAchievements = evaluateAchievements(
          updated.buildings,
          updated.deposits,
          updated.achievements
        );
        set({ achievements: newAchievements });
        return id;
      },

      updateBuilding: (id, patch) => {
        set((current) => ({
          buildings: current.buildings.map((b) =>
            b.id === id ? { ...b, ...patch } : b
          ),
        }));
        const updated = get();
        const newAchievements = evaluateAchievements(
          updated.buildings,
          updated.deposits,
          updated.achievements
        );
        set({ achievements: newAchievements });
      },

      removeBuilding: (id) => {
        set((current) => ({
          buildings: current.buildings.filter((b) => b.id !== id),
          deposits: current.deposits.filter((d) => d.buildingId !== id),
        }));
        const updated = get();
        const newAchievements = evaluateAchievements(
          updated.buildings,
          updated.deposits,
          updated.achievements
        );
        set({ achievements: newAchievements });
      },

      addDeposit: ({ buildingId, amount, date, note }) => {
        if (!(amount > 0) || !Number.isFinite(amount)) return;
        const state = get();
        const building = state.buildings.find((b) => b.id === buildingId);
        if (!building) return;
        const remaining = building.targetAmount - building.currentAmount;
        if (remaining <= 1e-9) return;
        const cappedAmount = Math.min(amount, remaining);
        const id = newId();
        set((current) => ({
          deposits: [
            { id, buildingId, amount: cappedAmount, date, note: trimNote(note) },
            ...current.deposits,
          ],
          buildings: current.buildings.map((b) =>
            b.id === buildingId
              ? { ...b, currentAmount: Math.min(b.targetAmount, b.currentAmount + cappedAmount) }
              : b
          ),
        }));
        const updated = get();
        const newAchievements = evaluateAchievements(
          updated.buildings,
          updated.deposits,
          updated.achievements
        );
        set({ achievements: newAchievements });
      },

      removeDeposit: (id) => {
        const state = get();
        const deposit = state.deposits.find((d) => d.id === id);
        if (!deposit) return;
        set((current) => ({
          deposits: current.deposits.filter((d) => d.id !== id),
          buildings: current.buildings.map((b) =>
            b.id === deposit.buildingId
              ? { ...b, currentAmount: Math.max(0, b.currentAmount - deposit.amount) }
              : b
          ),
        }));
        const updated = get();
        const newAchievements = evaluateAchievements(
          updated.buildings,
          updated.deposits,
          updated.achievements
        );
        set({ achievements: newAchievements });
      },

      replaceAll: (data) => {
        set(parseKingdomToolState(data));
      },

      reset: () => {
        set(EMPTY_KINGDOM_STATE);
      },
    }),
    {
      name: "finplan:kingdom:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
