import { describe, expect, it } from "vitest";
import {
  buildAmortizationSchedule,
  monthlyPayment,
  summarizeSchedule,
} from "@/lib/finance/amortization";

describe("amortization", () => {
  it("computes the standard annuity payment", () => {
    expect(monthlyPayment(200000, 0.06, 360)).toBeCloseTo(1199.10, 1);
    expect(monthlyPayment(12000, 0, 12)).toBeCloseTo(1000, 10);
    expect(monthlyPayment(1, 0.12, 1)).toBeCloseTo(1.01, 12);
  });

  it("produces a full schedule whose balances settle to zero", () => {
    const rows = buildAmortizationSchedule({
      principal: 200000,
      annualRate: 0.06,
      termMonths: 360,
    });

    expect(rows).toHaveLength(360);
    expect(rows[359].balance).toBe(0);
    expect(rows[0].payment).toBeCloseTo(monthlyPayment(200000, 0.06, 360), 6);

    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i].month).toBe(i + 1);
      expect(rows[i].balance).toBeLessThan(rows[i - 1].balance);
    }

    const summary = summarizeSchedule(rows);
    expect(summary.totalPrincipal).toBeCloseTo(200000, 4);
    expect(Math.abs(summary.totalInterest - 231676) < 2).toBe(true);
    expect(summary.months).toBe(360);
  });

  it("front-loads interest in the payment split", () => {
    const rows = buildAmortizationSchedule({
      principal: 200000,
      annualRate: 0.06,
      termMonths: 360,
    });
    expect(rows[0].interest).toBeGreaterThan(rows[0].principal);
    expect(rows[rows.length - 1].principal).toBeGreaterThan(
      rows[rows.length - 1].interest
    );
  });

  it("extra payments shorten the loan and cut interest", () => {
    const base = buildAmortizationSchedule({
      principal: 300000,
      annualRate: 0.055,
      termMonths: 360,
    });
    const accelerated = buildAmortizationSchedule({
      principal: 300000,
      annualRate: 0.055,
      termMonths: 360,
      extraMonthlyPayment: 200,
    });
    const baseSummary = summarizeSchedule(base);
    const fastSummary = summarizeSchedule(accelerated);

    expect(fastSummary.months).toBeLessThan(baseSummary.months);
    expect(fastSummary.totalInterest).toBeLessThan(baseSummary.totalInterest);
    expect(fastSummary.totalPrincipal).toBeCloseTo(300000, 4);
    expect(accelerated[accelerated.length - 1].balance).toBe(0);
    expect(
      accelerated.some((row) => row.extraPrincipal > 0)
    ).toBe(true);
  });

  it("rejects impossible loans", () => {
    expect(() => monthlyPayment(-1000, 0.05, 12)).toThrow(RangeError);
    expect(() => monthlyPayment(1000, -0.05, 12)).toThrow(RangeError);
    expect(() => monthlyPayment(1000, 0.05, 0)).toThrow(RangeError);
    expect(() =>
      buildAmortizationSchedule({ principal: 1000, annualRate: 0.1, termMonths: -1 })
    ).toThrow(RangeError);
  });
});
