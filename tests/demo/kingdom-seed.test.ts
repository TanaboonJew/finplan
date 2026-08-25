import { describe, expect, it } from "vitest";
import { createKingdomDemoState } from "@/lib/demo/kingdom";
import { parseKingdomToolState } from "@/lib/storage/kingdom-store";
import {
  totalWealth,
  buildingsCompleted,
} from "@/lib/finance/kingdom";

describe("kingdom demo seed", () => {
  it("produces a complete snapshot", () => {
    const demo = createKingdomDemoState();
    expect(demo.kingdomName).toBe("Demo Kingdom");
    expect(demo.buildings).toHaveLength(5);
    expect(demo.deposits.length).toBeGreaterThanOrEqual(10);
    expect(demo.achievements).toHaveLength(8);
  });

  it("is valid under parseKingdomToolState", () => {
    const demo = createKingdomDemoState();
    const parsed = parseKingdomToolState(demo);
    expect(parsed.buildings).toHaveLength(5);
  });

  it("has realistic amounts", () => {
    const demo = createKingdomDemoState();
    for (const building of demo.buildings) {
      expect(building.name.length).toBeGreaterThan(0);
      expect(building.targetAmount).toBeGreaterThan(0);
      expect(building.currentAmount).toBeGreaterThanOrEqual(0);
      expect(building.currentAmount).toBeLessThanOrEqual(building.targetAmount);
    }
  });

  it("has deposits that sum to building currentAmounts", () => {
    const demo = createKingdomDemoState();
    for (const building of demo.buildings) {
      const buildingDeposits = demo.deposits.filter(
        (d) => d.buildingId === building.id
      );
      const sum = buildingDeposits.reduce((acc, d) => acc + d.amount, 0);
      expect(sum).toBeCloseTo(building.currentAmount, 2);
    }
  });

  it("has at least one completed building", () => {
    const demo = createKingdomDemoState();
    expect(buildingsCompleted(demo.buildings)).toBeGreaterThanOrEqual(1);
  });

  it("has positive total wealth", () => {
    const demo = createKingdomDemoState();
    expect(totalWealth(demo.buildings)).toBeGreaterThan(0);
  });

  it("has all achievement ids from the constant list", () => {
    const demo = createKingdomDemoState();
    const ids = demo.achievements.map((a) => a.id);
    expect(ids).toContain("first_deposit");
    expect(ids).toContain("first_building");
    expect(ids).toContain("kingdom_complete");
    expect(ids.length).toBe(8);
  });
});
