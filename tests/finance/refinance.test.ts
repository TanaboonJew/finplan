import { describe, expect, it } from "vitest";
import {
  buildAmortizationSchedule,
  monthlyPayment,
  summarizeSchedule,
} from "@/lib/finance/amortization";
import { computeRefinanceBreakEven } from "@/lib/finance/refinance";

const CURRENT_LOAN = { principal: 100000, annualRate: 0.06, termMonths: 120 };
const NEW_LOAN = { principal: 100000, annualRate: 0.03, termMonths: 120 };

describe("computeRefinanceBreakEven", () => {
  it("lowers the payment when refinancing to a cheaper rate", () => {
    const result = computeRefinanceBreakEven(CURRENT_LOAN, NEW_LOAN, 2000);
    expect(result.newMonthlyPayment).toBeLessThan(
      result.currentMonthlyPayment
    );
    expect(result.monthlySaving).toBeCloseTo(
      result.currentMonthlyPayment - result.newMonthlyPayment,
      10
    );
  });

  it("computes break-even as closing cost over monthly saving", () => {
    const result = computeRefinanceBreakEven(CURRENT_LOAN, NEW_LOAN, 2000);
    const saving = result.currentMonthlyPayment - result.newMonthlyPayment;
    expect(result.breakEvenMonths).toBe(Math.ceil(2000 / saving));
    // Sanity: saving is roughly 100+ per month on a 2.5pt drop over 10y.
    expect(result.breakEvenMonths!).toBeGreaterThan(5);
    expect(result.breakEvenMonths!).toBeLessThan(40);
  });

  it("returns null break-even when there is no monthly saving", () => {
    // Same terms and same rate → no saving regardless of cost.
    const same = computeRefinanceBreakEven(CURRENT_LOAN, CURRENT_LOAN, 500);
    expect(same.monthlySaving).toBeCloseTo(0, 10);
    expect(same.breakEvenMonths).toBeNull();

    // Higher new rate also never breaks even.
    const worse = computeRefinanceBreakEven(CURRENT_LOAN, { ...NEW_LOAN, annualRate: 0.09 }, 500);
    expect(worse.breakEvenMonths).toBeNull();
    expect(worse.monthlySaving).toBeLessThan(0);
  });

  it("nets closing costs out of lifetime savings", () => {
    const result = computeRefinanceBreakEven(CURRENT_LOAN, NEW_LOAN, 2000);
    const oldSchedule = summarizeSchedule(
      buildAmortizationSchedule({ ...CURRENT_LOAN })
    );
    const newSchedule = summarizeSchedule(
      buildAmortizationSchedule({
        principal: NEW_LOAN.principal,
        annualRate: NEW_LOAN.annualRate,
        termMonths: NEW_LOAN.termMonths,
      })
    );
    expect(result.totalSavingsOverNewTerm).toBeCloseTo(
      oldSchedule.totalPaid - newSchedule.totalPaid - 2000,
      6
    );
    expect(result.totalSavingsOverNewTerm).toBeGreaterThan(0);
  });

  it("caps old-term comparison at the shorter schedule", () => {
    // New loan pays off twice as fast; monthly saving is negative but the
    // short-term comparison window is min(120, 60) months.
    const shorter = { ...NEW_LOAN, annualRate: 0.05, termMonths: 60 };
    const result = computeRefinanceBreakEven(CURRENT_LOAN, shorter, 1000);
    expect(result.totalSavingsOverOldTerm).toBeCloseTo(
      result.monthlySaving * 60 - 1000,
      6
    );
  });

  it("handles a zero-interest refinance", () => {
    const result = computeRefinanceBreakEven(
      CURRENT_LOAN,
      { ...NEW_LOAN, annualRate: 0 },
      2400
    );
    expect(result.newMonthlyPayment).toBeCloseTo(100000 / 120, 8);
    expect(result.breakEvenMonths).toBeGreaterThan(0);
  });

  it("rejects invalid inputs", () => {
    expect(() =>
      computeRefinanceBreakEven(
        { ...CURRENT_LOAN, principal: 0 },
        NEW_LOAN,
        0
      )
    ).toThrow(RangeError);
    expect(() =>
      computeRefinanceBreakEven(
        { ...CURRENT_LOAN, termMonths: 0 },
        NEW_LOAN,
        0
      )
    ).toThrow(RangeError);
    expect(() =>
      computeRefinanceBreakEven(CURRENT_LOAN, { ...NEW_LOAN, annualRate: -0.1 }, 0)
    ).toThrow(RangeError);
    expect(() => computeRefinanceBreakEven(CURRENT_LOAN, NEW_LOAN, -1)).toThrow(
      RangeError
    );
    // Zero closing cost is fine.
    expect(() => computeRefinanceBreakEven(CURRENT_LOAN, NEW_LOAN, 0)).not.toThrow();
  });

  it("stays consistent with the standalone payment function", () => {
    const result = computeRefinanceBreakEven(CURRENT_LOAN, NEW_LOAN, 0);
    expect(result.currentMonthlyPayment).toBe(
      monthlyPayment(CURRENT_LOAN.principal, CURRENT_LOAN.annualRate, CURRENT_LOAN.termMonths)
    );
    expect(result.newMonthlyPayment).toBe(
      monthlyPayment(NEW_LOAN.principal, NEW_LOAN.annualRate, NEW_LOAN.termMonths)
    );
  });
});
