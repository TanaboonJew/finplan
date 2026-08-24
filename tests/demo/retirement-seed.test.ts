import { describe, expect, it } from "vitest";
import { computeProjection } from "@/components/tools/retirement/projection";
import { createRetirementDemoSnapshot } from "@/lib/demo/retirement";
import {
  MIN_WITHDRAWAL_RATE,
  MAX_AGE,
} from "@/lib/storage/retirement-store";

describe("retirement demo seed", () => {
  const snapshot = createRetirementDemoSnapshot();

  it("produces a complete, in-range profile", () => {
    expect(snapshot.currentAge).toBeGreaterThan(18);
    expect(snapshot.retirementAge).toBeGreaterThan(snapshot.currentAge);
    expect(snapshot.retirementAge).toBeLessThanOrEqual(MAX_AGE);
    expect(snapshot.currentSavings).toBeGreaterThan(0);
    expect(snapshot.monthlyContribution).toBeGreaterThan(0);
    expect(snapshot.annualReturnRate).toBeGreaterThan(0);
    expect(snapshot.annualReturnRate).toBeLessThan(0.2);
    expect(snapshot.inflationRate).toBeGreaterThan(0);
    expect(snapshot.inflationRate).toBeLessThan(0.1);
    expect(snapshot.desiredRetirementIncome).toBeGreaterThan(0);
    expect(snapshot.withdrawalRate).toBeGreaterThanOrEqual(
      MIN_WITHDRAWAL_RATE
    );
    expect(snapshot.currency).toBe("USD");
  });

  it("projects a realistic shortfall story with finite numbers", () => {
    const result = computeProjection(snapshot);
    expect(result.yearsToRetirement).toBeGreaterThan(0);
    for (const key of ["bear", "base", "bull"] as const) {
      const outcome = result.scenarios[key];
      expect(Number.isFinite(outcome.fireTarget)).toBe(true);
      expect(Number.isFinite(outcome.balanceAtRetirement)).toBe(true);
      expect(outcome.series.length).toBe(result.yearsToRetirement + 1);
    }
    expect(result.gap).toBeLessThan(0);
    expect(result.neededMonthlyContribution).not.toBeNull();
    expect(result.neededMonthlyContribution!).toBeGreaterThan(
      snapshot.monthlyContribution
    );
    expect(Number.isFinite(result.realProjectedBalance)).toBe(true);
  });
});
