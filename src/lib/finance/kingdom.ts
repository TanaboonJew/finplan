import { assertFiniteNumber, assertNonNegative, assertPositive } from "./validation";

export type BuildingIcon = "tower" | "house" | "castle" | "hut" | "temple" | "bridge";

export const BUILDING_ICONS: readonly BuildingIcon[] = ["tower", "house", "castle", "hut", "temple", "bridge"];

export function isBuildingIcon(value: unknown): value is BuildingIcon {
  return typeof value === "string" && (BUILDING_ICONS as readonly string[]).includes(value);
}

export type BuildingColor = "emerald" | "blue" | "amber" | "rose" | "violet" | "cyan";

export const BUILDING_COLORS: readonly BuildingColor[] = ["emerald", "blue", "amber", "rose", "violet", "cyan"];

export function isBuildingColor(value: unknown): value is BuildingColor {
  return typeof value === "string" && (BUILDING_COLORS as readonly string[]).includes(value);
}

export interface Building {
  id: string;
  name: string;
  icon: BuildingIcon;
  targetAmount: number;
  currentAmount: number;
  color: BuildingColor;
  createdAt: string;
}

export interface Deposit {
  id: string;
  buildingId: string;
  amount: number;
  date: string;
  note: string;
}

export type AchievementId =
  | "first_deposit"
  | "first_building"
  | "half_funded"
  | "first_complete"
  | "five_buildings"
  | "thousand_club"
  | "five_achievements"
  | "kingdom_complete";

export interface Achievement {
  id: AchievementId;
  unlockedAt: string | null;
}

export const ALL_ACHIEVEMENT_IDS: readonly AchievementId[] = [
  "first_deposit",
  "first_building",
  "half_funded",
  "first_complete",
  "five_buildings",
  "thousand_club",
  "five_achievements",
  "kingdom_complete",
];

export function createEmptyAchievements(): Achievement[] {
  return ALL_ACHIEVEMENT_IDS.map((id) => ({ id, unlockedAt: null }));
}

export interface BuildingTierInfo {
  level: number;
  label: string;
}

const TIER_THRESHOLDS: readonly { min: number; level: number; label: string }[] = [
  { min: 1.0, level: 5, label: "complete" },
  { min: 0.8, level: 4, label: "furnished" },
  { min: 0.6, level: 3, label: "roof" },
  { min: 0.4, level: 2, label: "walls" },
  { min: 0.2, level: 1, label: "base" },
  { min: 0.0, level: 0, label: "foundation" },
];

export function buildingProgress(building: Building): number {
  assertPositive(building.targetAmount, "targetAmount");
  const ratio = building.currentAmount / building.targetAmount;
  return Math.min(1, Math.max(0, ratio));
}

export function buildingTier(progress: number): BuildingTierInfo {
  assertFiniteNumber(progress, "progress");
  const clamped = Math.min(1, Math.max(0, progress));
  for (const tier of TIER_THRESHOLDS) {
    if (clamped >= tier.min) {
      return { level: tier.level, label: tier.label };
    }
  }
  return { level: 0, label: "foundation" };
}

export function totalWealth(buildings: readonly Building[]): number {
  let sum = 0;
  for (const b of buildings) {
    assertNonNegative(b.currentAmount, "currentAmount");
    sum += b.currentAmount;
  }
  return sum;
}

export function totalTarget(buildings: readonly Building[]): number {
  let sum = 0;
  for (const b of buildings) {
    assertPositive(b.targetAmount, "targetAmount");
    sum += b.targetAmount;
  }
  return sum;
}

export function buildingsCompleted(buildings: readonly Building[]): number {
  let count = 0;
  for (const b of buildings) {
    if (buildingProgress(b) >= 1) count += 1;
  }
  return count;
}

export function evaluateAchievements(
  buildings: readonly Building[],
  deposits: readonly Deposit[],
  prior: readonly Achievement[]
): Achievement[] {
  const now = new Date().toISOString();
  const priorMap = new Map(prior.map((a) => [a.id, a.unlockedAt]));
  const result: Achievement[] = [];

  const checks: Record<AchievementId, boolean> = {
    first_deposit: deposits.length > 0,
    first_building: buildings.length > 0,
    half_funded: buildings.some((b) => buildingProgress(b) >= 0.5),
    first_complete: buildings.some((b) => buildingProgress(b) >= 1),
    five_buildings: buildings.length >= 5,
    thousand_club: totalWealth(buildings) >= 1000,
    five_achievements: false,
    kingdom_complete: buildings.length > 0 && buildings.every((b) => buildingProgress(b) >= 1),
  };

  for (const id of ALL_ACHIEVEMENT_IDS) {
    const wasUnlocked = priorMap.get(id) ?? null;
    if (wasUnlocked) {
      result.push({ id, unlockedAt: wasUnlocked });
    } else if (checks[id]) {
      result.push({ id, unlockedAt: now });
    } else {
      result.push({ id, unlockedAt: null });
    }
  }

  const unlockedCount = result.filter((a) => a.unlockedAt !== null).length;
  if (unlockedCount >= 5) {
    const fiveAch = result.find((a) => a.id === "five_achievements");
    if (fiveAch && !fiveAch.unlockedAt) {
      fiveAch.unlockedAt = now;
    }
  }

  return result;
}

export interface KingdomToolPersisted {
  kingdomName: string;
  buildings: Building[];
  deposits: Deposit[];
  achievements: Achievement[];
}
