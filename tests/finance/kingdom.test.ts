import { describe, expect, it } from "vitest";
import {
  buildingProgress,
  buildingTier,
  totalWealth,
  totalTarget,
  buildingsCompleted,
  evaluateAchievements,
  createEmptyAchievements,
  type Building,
  type Deposit,
} from "@/lib/finance/kingdom";

function makeBuilding(overrides: Partial<Building> = {}): Building {
  return {
    id: "b1",
    name: "Test Building",
    icon: "castle",
    targetAmount: 1000,
    currentAmount: 0,
    color: "emerald",
    createdAt: "2026-01-01",
    ...overrides,
  };
}

function makeDeposit(overrides: Partial<Deposit> = {}): Deposit {
  return {
    id: "d1",
    buildingId: "b1",
    amount: 100,
    date: "2026-06-01",
    note: "test",
    ...overrides,
  };
}

describe("buildingProgress", () => {
  it("returns 0 when no amount deposited", () => {
    expect(buildingProgress(makeBuilding())).toBe(0);
  });

  it("returns 0.5 at half target", () => {
    expect(buildingProgress(makeBuilding({ currentAmount: 500 }))).toBe(0.5);
  });

  it("returns 1 at or above target", () => {
    expect(buildingProgress(makeBuilding({ currentAmount: 1000 }))).toBe(1);
    expect(buildingProgress(makeBuilding({ currentAmount: 2000 }))).toBe(1);
  });

  it("clamps negative to 0", () => {
    expect(buildingProgress(makeBuilding({ currentAmount: -100 }))).toBe(0);
  });

  it("throws on non-positive target", () => {
    expect(() => buildingProgress(makeBuilding({ targetAmount: 0 }))).toThrow();
    expect(() => buildingProgress(makeBuilding({ targetAmount: -100 }))).toThrow();
  });
});

describe("buildingTier", () => {
  it("returns foundation at 0%", () => {
    expect(buildingTier(0)).toEqual({ level: 0, label: "foundation" });
  });

  it("returns base at 20%", () => {
    expect(buildingTier(0.2)).toEqual({ level: 1, label: "base" });
  });

  it("returns walls at 40%", () => {
    expect(buildingTier(0.4)).toEqual({ level: 2, label: "walls" });
  });

  it("returns roof at 60%", () => {
    expect(buildingTier(0.6)).toEqual({ level: 3, label: "roof" });
  });

  it("returns furnished at 80%", () => {
    expect(buildingTier(0.8)).toEqual({ level: 4, label: "furnished" });
  });

  it("returns complete at 100%", () => {
    expect(buildingTier(1)).toEqual({ level: 5, label: "complete" });
  });

  it("clamps out-of-range values", () => {
    expect(buildingTier(1.5)).toEqual({ level: 5, label: "complete" });
    expect(buildingTier(-0.1)).toEqual({ level: 0, label: "foundation" });
  });
});

describe("totalWealth", () => {
  it("sums currentAmounts", () => {
    const buildings = [
      makeBuilding({ id: "a", currentAmount: 100 }),
      makeBuilding({ id: "b", currentAmount: 200 }),
    ];
    expect(totalWealth(buildings)).toBe(300);
  });

  it("returns 0 for empty list", () => {
    expect(totalWealth([])).toBe(0);
  });
});

describe("totalTarget", () => {
  it("sums targetAmounts", () => {
    const buildings = [
      makeBuilding({ id: "a", targetAmount: 500 }),
      makeBuilding({ id: "b", targetAmount: 1500 }),
    ];
    expect(totalTarget(buildings)).toBe(2000);
  });
});

describe("buildingsCompleted", () => {
  it("counts buildings at 100%", () => {
    const buildings = [
      makeBuilding({ id: "a", currentAmount: 1000, targetAmount: 1000 }),
      makeBuilding({ id: "b", currentAmount: 500, targetAmount: 1000 }),
    ];
    expect(buildingsCompleted(buildings)).toBe(1);
  });

  it("returns 0 when none complete", () => {
    expect(buildingsCompleted([makeBuilding({ currentAmount: 500 })])).toBe(0);
  });
});

describe("evaluateAchievements", () => {
  it("unlocks first_deposit when deposits exist", () => {
    const result = evaluateAchievements(
      [],
      [makeDeposit()],
      createEmptyAchievements()
    );
    const firstDeposit = result.find((a) => a.id === "first_deposit");
    expect(firstDeposit?.unlockedAt).not.toBeNull();
  });

  it("unlocks first_building when buildings exist", () => {
    const result = evaluateAchievements(
      [makeBuilding()],
      [],
      createEmptyAchievements()
    );
    const firstBuilding = result.find((a) => a.id === "first_building");
    expect(firstBuilding?.unlockedAt).not.toBeNull();
  });

  it("unlocks half_funded at 50%", () => {
    const result = evaluateAchievements(
      [makeBuilding({ currentAmount: 500 })],
      [],
      createEmptyAchievements()
    );
    const halfFunded = result.find((a) => a.id === "half_funded");
    expect(halfFunded?.unlockedAt).not.toBeNull();
  });

  it("unlocks first_complete at 100%", () => {
    const result = evaluateAchievements(
      [makeBuilding({ currentAmount: 1000, targetAmount: 1000 })],
      [],
      createEmptyAchievements()
    );
    const firstComplete = result.find((a) => a.id === "first_complete");
    expect(firstComplete?.unlockedAt).not.toBeNull();
  });

  it("unlocks five_buildings with 5+ buildings", () => {
    const buildings = Array.from({ length: 5 }, (_, i) =>
      makeBuilding({ id: `b${i}` })
    );
    const result = evaluateAchievements(
      buildings,
      [],
      createEmptyAchievements()
    );
    const five = result.find((a) => a.id === "five_buildings");
    expect(five?.unlockedAt).not.toBeNull();
  });

  it("unlocks thousand_club at 1000 total wealth", () => {
    const result = evaluateAchievements(
      [makeBuilding({ currentAmount: 1000 })],
      [],
      createEmptyAchievements()
    );
    const club = result.find((a) => a.id === "thousand_club");
    expect(club?.unlockedAt).not.toBeNull();
  });

  it("preserves previously unlocked achievements", () => {
    const prior = createEmptyAchievements().map((a) =>
      a.id === "first_deposit" ? { ...a, unlockedAt: "2026-01-01T00:00:00.000Z" } : a
    );
    const result = evaluateAchievements([], [], prior);
    const firstDeposit = result.find((a) => a.id === "first_deposit");
    expect(firstDeposit?.unlockedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("does not re-unlock already unlocked achievements", () => {
    const prior = createEmptyAchievements().map((a) =>
      a.id === "first_building" ? { ...a, unlockedAt: "2026-01-01T00:00:00.000Z" } : a
    );
    const result = evaluateAchievements([makeBuilding()], [], prior);
    const fb = result.find((a) => a.id === "first_building");
    expect(fb?.unlockedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("leaves non-met achievements as null", () => {
    const result = evaluateAchievements([], [], createEmptyAchievements());
    const nonMet = result.filter((a) => !["first_deposit", "first_building"].includes(a.id));
    for (const a of nonMet) {
      expect(a.unlockedAt).toBeNull();
    }
  });
});

describe("createEmptyAchievements", () => {
  it("returns 8 achievements all null", () => {
    const achs = createEmptyAchievements();
    expect(achs).toHaveLength(8);
    for (const a of achs) {
      expect(a.unlockedAt).toBeNull();
    }
  });
});
