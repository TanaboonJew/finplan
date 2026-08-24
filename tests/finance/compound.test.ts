import { describe, expect, it } from "vitest";
import {
  futureValue,
  futureValueOfAnnuity,
  growthSchedule,
  presentValue,
  presentValueOfAnnuity,
  projectBalance,
} from "@/lib/finance/compound";

describe("compound", () => {
  it("computes future value of a lump sum", () => {
    expect(futureValue(10000, 0.05, 10)).toBeCloseTo(16288.95, 1);
    expect(futureValue(1000, 0, 25)).toBe(1000);
    expect(futureValue(1000, 0.01, 0)).toBe(1000);
  });

  it("discounts a future amount back to present value", () => {
    expect(presentValue(16288.95, 0.05, 10)).toBeCloseTo(10000, 0);
  });

  it("computes ordinary annuity future values", () => {
    expect(futureValueOfAnnuity(100, 0.005, 120)).toBeCloseTo(16387.93, 1);
    expect(futureValueOfAnnuity(100, 0, 12)).toBe(1200);
    expect(futureValueOfAnnuity(100, 0.05, 0)).toBe(0);
  });

  it("computes ordinary annuity present values", () => {
    expect(presentValueOfAnnuity(100, 0.005, 120)).toBeCloseTo(9007.35, 1);
    expect(presentValueOfAnnuity(50, 0, 24)).toBe(1200);
  });

  it("projects a balance from initial savings plus contributions", () => {
    const balance = projectBalance({
      initialBalance: 50000,
      monthlyContribution: 500,
      annualRate: 0.06,
      months: 240,
    });
    const closedForm =
      50000 * Math.pow(1.005, 240) +
      500 * ((Math.pow(1.005, 240) - 1) / 0.005);
    expect(balance).toBeCloseTo(closedForm, 6);
  });

  it("builds a month-by-month schedule consistent with the closed form", () => {
    const input = {
      initialBalance: 1000,
      monthlyContribution: 100,
      annualRate: 0.12,
      months: 12,
    };
    const schedule = growthSchedule(input);

    expect(schedule).toHaveLength(13);
    expect(schedule[0]).toEqual({ month: 0, balance: 1000 });
    expect(schedule[12].balance).toBeCloseTo(projectBalance(input), 8);
    for (let i = 1; i < schedule.length; i += 1) {
      expect(schedule[i].balance).toBeGreaterThan(schedule[i - 1].balance);
    }
  });

  it("rejects invalid inputs", () => {
    expect(() => futureValue(-1, 0.05, 10)).toThrow(RangeError);
    expect(() => futureValue(100, 0.05, -3)).toThrow(RangeError);
    expect(() => futureValueOfAnnuity(100, 0.05, 2.5)).toThrow(RangeError);
    expect(() => growthSchedule({ ...{ initialBalance: 0, monthlyContribution: 0, annualRate: 0.1, months: 1.5 } })).toThrow(
      RangeError
    );
  });
});
