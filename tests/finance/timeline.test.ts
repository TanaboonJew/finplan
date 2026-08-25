import { describe, expect, it } from "vitest";
import {
  combinedCashFlow,
  detectConflicts,
  goalNominalCost,
  goalProjectedSavings,
  goalShortfall,
  totalMonthlyDemand,
  type TimelineGoal,
} from "@/lib/finance/timeline";

function makeGoal(overrides: Partial<TimelineGoal> = {}): TimelineGoal {
  return {
    id: "house",
    name: "House down payment",
    category: "housing",
    startAge: 30,
    endAge: 35,
    totalCost: 100000,
    monthlySavings: 1000,
    annualReturnRate: 0.05,
    inflationRate: 0.02,
    ...overrides,
  };
}

describe("goalNominalCost", () => {
  it("compounds the cost by inflation until the end age", () => {
    // currentAge 30 → 5 years of inflation
    expect(goalNominalCost(makeGoal(), 30)).toBeCloseTo(
      100000 * Math.pow(1.02, 5),
      8
    );
  });

  it("returns the raw cost when the window has closed (years = 0)", () => {
    expect(goalNominalCost(makeGoal(), 35)).toBe(100000);
    expect(goalNominalCost(makeGoal(), 40)).toBe(100000);
  });

  it("handles zero inflation and deflation above -100%", () => {
    expect(goalNominalCost(makeGoal({ inflationRate: 0 }), 30)).toBe(100000);
    expect(goalNominalCost(makeGoal({ inflationRate: -0.5 }), 30)).toBeCloseTo(
      100000 * Math.pow(0.5, 5),
      8
    );
  });

  it("rejects inflation below -100% and negative costs; exactly -100% zeroes the cost", () => {
    expect(goalNominalCost(makeGoal({ inflationRate: -1 }), 30)).toBe(0);
    expect(() => goalNominalCost(makeGoal({ inflationRate: -1.5 }), 30)).toThrow(
      RangeError
    );
    expect(() => goalNominalCost(makeGoal({ totalCost: -1 }), 30)).toThrow(
      RangeError
    );
  });
});

describe("goalProjectedSavings", () => {
  it("projects an annuity with positive growth", () => {
    // months = 60, monthly rate = 0.05/12
    const months = 60;
    const r = 0.05 / 12;
    const expected = 1000 * ((Math.pow(1 + r, months) - 1) / r);
    expect(goalProjectedSavings(makeGoal(), 30)).toBeCloseTo(expected, 6);
  });

  it("accumulates linearly with zero growth", () => {
    expect(goalProjectedSavings(makeGoal({ annualReturnRate: 0 }), 30)).toBe(
      60000
    );
  });

  it("returns 0 with no horizon and handles tiny horizons", () => {
    expect(goalProjectedSavings(makeGoal(), 35)).toBe(0);
    // One month horizon: endAge - age = 1/12 years.
    expect(
      goalProjectedSavings(makeGoal({ annualReturnRate: 0 }), 34 + 11 / 12)
    ).toBeCloseTo(1000, 8);
  });

  it("rejects rates below -100% and negative savings", () => {
    expect(() =>
      goalProjectedSavings(makeGoal({ annualReturnRate: -1.5 }), 30)
    ).toThrow(RangeError);
    expect(() =>
      goalProjectedSavings(makeGoal({ monthlySavings: -10 }), 30)
    ).toThrow(RangeError);
  });
});

describe("goalShortfall", () => {
  it("clamps surpluses to zero and keeps shortfalls positive", () => {
    expect(goalShortfall(50000, 40000)).toBe(0);
    expect(goalShortfall(40000, 50000)).toBe(10000);
    expect(goalShortfall(50000, 50000)).toBe(0);
  });
});

describe("detectConflicts", () => {
  it("flags overlapping goals whose combined demand exceeds the budget", () => {
    const goals = [
      makeGoal(),
      makeGoal({ id: "car", startAge: 33, endAge: 36, monthlySavings: 800 }),
    ];
    const conflicts = detectConflicts(goals, 1500);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      goalA: "house",
      goalB: "car",
      overlapStart: 33,
      overlapEnd: 35,
      monthlyDemand: 1800,
      gap: 300,
    });
  });

  it("stays silent when demand fits the budget or ranges merely touch", () => {
    const touching = [
      makeGoal({ id: "a", startAge: 30, endAge: 32 }),
      makeGoal({ id: "b", startAge: 32, endAge: 34 }),
    ];
    expect(detectConflicts(touching, 100)).toEqual([]);

    const affordable = [
      makeGoal({ id: "a" }),
      makeGoal({ id: "b", startAge: 33, endAge: 36, monthlySavings: 400 }),
    ];
    expect(detectConflicts(affordable, 1500)).toEqual([]);
  });

  it("reports every conflicting pair in a triple overlap", () => {
    const goals = [
      makeGoal({ id: "a", startAge: 30, endAge: 40 }),
      makeGoal({ id: "b", startAge: 30, endAge: 40 }),
      makeGoal({ id: "c", startAge: 30, endAge: 40 }),
    ];
    expect(detectConflicts(goals, 100)).toHaveLength(3);
  });

  it("handles empty lists", () => {
    expect(detectConflicts([], 1000)).toEqual([]);
  });
});

describe("totalMonthlyDemand", () => {
  it("uses half-open [start, end) windows", () => {
    const goals = [
      makeGoal({ startAge: 30, endAge: 35, monthlySavings: 300 }),
      makeGoal({ id: "b", startAge: 35, endAge: 40, monthlySavings: 700 }),
    ];
    expect(totalMonthlyDemand(goals, 29)).toBe(0);
    expect(totalMonthlyDemand(goals, 30)).toBe(300);
    expect(totalMonthlyDemand(goals, 34)).toBe(300);
    expect(totalMonthlyDemand(goals, 35)).toBe(700); // house ended exactly here
    expect(totalMonthlyDemand(goals, 40)).toBe(0);
  });
});

describe("combinedCashFlow", () => {
  it("returns empty lines for no goals", () => {
    expect(combinedCashFlow([], 1000, 30)).toEqual({
      months: [],
      budgetLine: [],
      demandLine: [],
      balanceLine: [],
    });
  });

  it("accumulates surplus into the balance month by month", () => {
    const result = combinedCashFlow([makeGoal()], 1200, 30);
    // Ages 30..~35 save a 200/month surplus; at age 35 exactly the goal
    // window closes (half-open) so that final point banks the full budget.
    expect(result.balanceLine[result.balanceLine.length - 1]).toBeCloseTo(
      13200,
      6
    );
    expect(result.months[0]).toBe(360);
    expect(result.months[result.months.length - 1]).toBe(420);
    expect(result.demandLine.every((d) => d === 1000 || d === 0)).toBe(true);
    expect(result.budgetLine.every((b) => b === 1200)).toBe(true);
  });

  it("goes negative when demand exceeds budget", () => {
    const result = combinedCashFlow([makeGoal()], 500, 30);
    expect(result.balanceLine[result.balanceLine.length - 1]!).toBeLessThan(0);
  });
});
