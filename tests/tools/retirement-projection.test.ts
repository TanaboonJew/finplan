import { describe, expect, it } from "vitest";
import { projectBalance } from "@/lib/finance/compound";
import {
  computeProjection,
  scenarioAssumptions,
  type ProjectionResult,
} from "@/components/tools/retirement/projection";
import type { RetirementSnapshot } from "@/lib/storage/retirement-store";

function makeSnapshot(
  overrides: Partial<RetirementSnapshot> = {}
): RetirementSnapshot {
  return {
    currentAge: 35,
    retirementAge: 65,
    currentSavings: 50000,
    monthlyContribution: 1000,
    annualReturnRate: 0.07,
    inflationRate: 0.03,
    desiredRetirementIncome: 48000,
    withdrawalRate: 0.04,
    currency: "USD",
    ...overrides,
  };
}

describe("scenarioAssumptions", () => {
  it("spreads return by ±2pp and inflation by ∓1pp around the base", () => {
    const scenarios = scenarioAssumptions({
      annualReturnRate: 0.07,
      inflationRate: 0.03,
    });
    expect(scenarios.bear.annualReturnRate).toBeCloseTo(0.05);
    expect(scenarios.bear.inflationRate).toBeCloseTo(0.04);
    expect(scenarios.base).toEqual({ annualReturnRate: 0.07, inflationRate: 0.03 });
    expect(scenarios.bull.annualReturnRate).toBeCloseTo(0.09);
    expect(scenarios.bull.inflationRate).toBeCloseTo(0.02);
  });

  it("clamps rates at zero", () => {
    const scenarios = scenarioAssumptions({
      annualReturnRate: 0.01,
      inflationRate: 0,
    });
    expect(scenarios.bull.inflationRate).toBe(0);
    expect(scenarios.bear.annualReturnRate).toBe(0);
  });
});

describe("computeProjection", () => {
  const snapshot = makeSnapshot();
  const result: ProjectionResult = computeProjection(snapshot);

  it("derives the FIRE number from inflated income over the withdrawal rate", () => {
    const years = 30;
    const expense = 48000 * Math.pow(1.03, years);
    expect(result.baseFireTarget).toBeCloseTo(expense / 0.04, 6);
    expect(result.scenarios.base.expenseAtRetirement).toBeCloseTo(expense, 6);
  });

  it("matches projectBalance for the base scenario horizon", () => {
    expect(result.projectedBalance).toBeCloseTo(
      projectBalance({
        initialBalance: snapshot.currentSavings,
        monthlyContribution: snapshot.monthlyContribution,
        annualRate: snapshot.annualReturnRate,
        months: 360,
      }),
      6
    );
  });

  it("deflates the projection into today's money when inflation is positive", () => {
    expect(result.realProjectedBalance).toBeLessThan(result.projectedBalance);
    expect(result.realProjectedBalance).toBeCloseTo(
      result.projectedBalance / Math.pow(1.03, 30),
      6
    );
  });

  it("orders scenario outcomes bull > base > bear", () => {
    expect(result.scenarios.bull.balanceAtRetirement).toBeGreaterThan(
      result.scenarios.base.balanceAtRetirement
    );
    expect(result.scenarios.base.balanceAtRetirement).toBeGreaterThan(
      result.scenarios.bear.balanceAtRetirement
    );
    expect(result.scenarios.bear.fireTarget).toBeGreaterThan(
      result.scenarios.base.fireTarget
    );
  });

  it("produces one series point per year inclusive of both endpoint ages", () => {
    for (const key of ["bear", "base", "bull"] as const) {
      expect(result.scenarios[key].series).toHaveLength(31);
      expect(result.scenarios[key].series[0]).toEqual({
        age: 35,
        balance: 50000,
      });
      expect(result.scenarios[key].series[30]!.age).toBe(65);
    }
  });

  it("solves a total monthly contribution that closes the gap exactly", () => {
    const short = computeProjection(
      makeSnapshot({ monthlyContribution: 100 })
    );
    expect(short.gap).toBeLessThan(0);
    expect(short.neededMonthlyContribution).not.toBeNull();
    expect(short.neededMonthlyContribution!).toBeGreaterThan(100);

    const closed = projectBalance({
      initialBalance: 50000,
      monthlyContribution: short.neededMonthlyContribution!,
      annualRate: short.scenarios.base.assumptions.annualReturnRate,
      months: 360,
    });
    expect(closed).toBeCloseTo(short.baseFireTarget, 4);
  });

  it("reports zero needed contribution when already on track", () => {
    const rich = computeProjection(makeSnapshot({ currentSavings: 2000000 }));
    expect(rich.gap).toBeGreaterThan(0);
    expect(rich.neededMonthlyContribution).toBeNull();
    expect(rich.fiAge).not.toBeNull();
    expect(rich.fiAge!).toBeGreaterThan(35);
    expect(rich.fiAge!).toBeLessThan(65);
  });

  it("handles a zero-year horizon without inflating or contributing", () => {
    const now = computeProjection(
      makeSnapshot({ currentAge: 65, retirementAge: 65 })
    );
    expect(now.yearsToRetirement).toBe(0);
    expect(now.scenarios.base.series).toHaveLength(1);
    expect(now.baseFireTarget).toBeCloseTo(48000 / 0.04, 6);
    expect(now.projectedBalance).toBeCloseTo(50000, 6);
    expect(now.realProjectedBalance).toBeCloseTo(50000, 6);
    expect(now.neededMonthlyContribution).toBeNull();
  });

  it("handles zero return and zero inflation deterministically", () => {
    const flat = computeProjection(
      makeSnapshot({ annualReturnRate: 0, inflationRate: 0 })
    );
    expect(flat.projectedBalance).toBeCloseTo(
      50000 + 1000 * 360,
      6
    );
    expect(flat.realProjectedBalance).toBeCloseTo(flat.projectedBalance, 6);
    expect(flat.scenarios.bear.balanceAtRetirement).toBeCloseTo(
      flat.scenarios.base.balanceAtRetirement,
      6
    );
  });

  it("rejects a non-positive withdrawal rate like the engine does", () => {
    expect(() =>
      computeProjection(makeSnapshot({ withdrawalRate: 0 }))
    ).toThrow(RangeError);
  });
});
