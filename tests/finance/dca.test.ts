import { describe, expect, it } from "vitest";
import {
  computeBreakevenHorizon,
  computeDcaSchedule,
  compareDcaFunds,
  type DcaFundParams,
} from "@/lib/finance/dca";

const LOW_COST: DcaFundParams = {
  name: "Index fund",
  expenseRatio: 0.0003,
  frontLoad: 0,
  exitLoad: 0,
  annualReturn: 0.08,
};

const HIGH_COST: DcaFundParams = {
  name: "Active fund",
  expenseRatio: 0.015,
  frontLoad: 0.05,
  exitLoad: 0.01,
  annualReturn: 0.095,
};

describe("computeDcaSchedule", () => {
  it("returns one more point than months (month 0 baseline)", () => {
    const schedule = computeDcaSchedule(LOW_COST, 500, 120);
    expect(schedule).toHaveLength(121);
    expect(schedule[0]).toEqual({ month: 0, balance: 0, grossBalance: 0, cumulativeFees: 0 });
  });

  it("grows balance each month with positive contributions", () => {
    const schedule = computeDcaSchedule(LOW_COST, 500, 60);
    for (let i = 1; i < schedule.length; i += 1) {
      expect(schedule[i].balance).toBeGreaterThan(schedule[i - 1].balance);
    }
  });

  it("reports cumulative fees that grow over time", () => {
    const schedule = computeDcaSchedule(HIGH_COST, 500, 120);
    for (let i = 2; i < schedule.length; i += 1) {
      expect(schedule[i].cumulativeFees).toBeGreaterThanOrEqual(
        schedule[i - 1].cumulativeFees
      );
    }
  });

  it("applies exit load at each month's ending balance", () => {
    const noExit: DcaFundParams = { ...HIGH_COST, exitLoad: 0 };
    const withExit: DcaFundParams = { ...HIGH_COST, exitLoad: 0.05 };
    const scheduleNoExit = computeDcaSchedule(noExit, 500, 60);
    const scheduleWithExit = computeDcaSchedule(withExit, 500, 60);
    expect(scheduleWithExit[60].balance).toBeLessThan(scheduleNoExit[60].balance);
  });

  it("gross balance is the same regardless of fees", () => {
    const noFees: DcaFundParams = { ...HIGH_COST, expenseRatio: 0, frontLoad: 0, exitLoad: 0 };
    const withFees: DcaFundParams = { ...HIGH_COST };
    const scheduleNoFees = computeDcaSchedule(noFees, 500, 120);
    const scheduleWithFees = computeDcaSchedule(withFees, 500, 120);
    expect(scheduleNoFees[120].grossBalance).toBeCloseTo(scheduleWithFees[120].grossBalance, 0);
  });

  it("front load reduces invested amount", () => {
    const noLoad: DcaFundParams = { ...LOW_COST, frontLoad: 0 };
    const withLoad: DcaFundParams = { ...LOW_COST, frontLoad: 0.1 };
    const scheduleNoLoad = computeDcaSchedule(noLoad, 500, 12);
    const scheduleWithLoad = computeDcaSchedule(withLoad, 500, 12);
    expect(scheduleWithLoad[12].balance).toBeLessThan(scheduleNoLoad[12].balance);
  });

  it("zero return still accumulates from contributions minus fees", () => {
    const zeroReturn: DcaFundParams = {
      name: "Zero",
      expenseRatio: 0.01,
      frontLoad: 0,
      exitLoad: 0,
      annualReturn: 0,
    };
    const schedule = computeDcaSchedule(zeroReturn, 1000, 12);
    expect(schedule[12].balance).toBeLessThan(12000);
    expect(schedule[12].balance).toBeGreaterThan(0);
  });

  it("rejects invalid inputs", () => {
    expect(() => computeDcaSchedule(LOW_COST, 0, 12)).toThrow(RangeError);
    expect(() => computeDcaSchedule(LOW_COST, 500, 0)).toThrow(RangeError);
    expect(() => computeDcaSchedule(LOW_COST, -100, 12)).toThrow(RangeError);
  });
});

describe("compareDcaFunds", () => {
  it("returns one result per fund", () => {
    const results = compareDcaFunds([LOW_COST, HIGH_COST], 500, 360);
    expect(results).toHaveLength(2);
  });

  it("each result has correct total invested", () => {
    const results = compareDcaFunds([LOW_COST, HIGH_COST], 500, 120);
    for (const r of results) {
      expect(r.totalInvested).toBe(500 * 120);
    }
  });

  it("fee drag is positive for funds with fees", () => {
    const results = compareDcaFunds([LOW_COST, HIGH_COST], 500, 360);
    expect(results[0].feeDragPercent).toBeGreaterThanOrEqual(0);
    expect(results[1].feeDragPercent).toBeGreaterThan(0);
  });

  it("higher fee fund has higher fee drag", () => {
    const results = compareDcaFunds([LOW_COST, HIGH_COST], 500, 360);
    expect(results[1].feeDragPercent).toBeGreaterThan(results[0].feeDragPercent);
  });
});

describe("computeBreakevenHorizon", () => {
  it("finds the month where the lower-fee fund overtakes", () => {
    const month = computeBreakevenHorizon(
      HIGH_COST,
      LOW_COST,
      500,
      600
    );
    expect(month).not.toBeNull();
    expect(month!).toBeGreaterThan(0);
    expect(month!).toBeLessThanOrEqual(600);
  });

  it("returns null when funds never cross", () => {
    const identical: DcaFundParams = {
      name: "Same",
      expenseRatio: 0.01,
      frontLoad: 0,
      exitLoad: 0,
      annualReturn: 0.08,
    };
    const month = computeBreakevenHorizon(identical, { ...identical, name: "Same2" }, 500, 600);
    expect(month).toBeNull();
  });

  it("returns month 1 if fund B starts ahead", () => {
    const cheap: DcaFundParams = {
      name: "Cheap",
      expenseRatio: 0,
      frontLoad: 0,
      exitLoad: 0,
      annualReturn: 0.1,
    };
    const expensive: DcaFundParams = {
      name: "Expensive",
      expenseRatio: 0.5,
      frontLoad: 0.9,
      exitLoad: 0,
      annualReturn: 0,
    };
    const month = computeBreakevenHorizon(expensive, cheap, 500, 600);
    expect(month).toBe(1);
  });

  it("rejects invalid inputs", () => {
    expect(() => computeBreakevenHorizon(LOW_COST, HIGH_COST, 0, 12)).toThrow(RangeError);
    expect(() => computeBreakevenHorizon(LOW_COST, HIGH_COST, 500, 0)).toThrow(RangeError);
  });
});
