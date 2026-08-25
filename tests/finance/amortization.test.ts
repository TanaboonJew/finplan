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

  it("amortizes a zero-interest loan as pure principal splits", () => {
    const rows = buildAmortizationSchedule({
      principal: 12000,
      annualRate: 0,
      termMonths: 12,
    });
    expect(rows).toHaveLength(12);
    for (const row of rows) {
      expect(row.interest).toBe(0);
      expect(row.principal).toBeCloseTo(1000, 8);
      expect(row.payment).toBeCloseTo(row.principal + row.extraPrincipal, 8);
    }
    // Uneven principal divides with a final balancing payment.
    const summary = summarizeSchedule(rows);
    expect(summary.totalInterest).toBe(0);
    expect(summary.totalPrincipal).toBeCloseTo(12000, 6);
    expect(summary.totalPaid).toBeCloseTo(12000, 6);
    const uneven = buildAmortizationSchedule({
      principal: 100,
      annualRate: 0,
      termMonths: 3,
    });
    expect(uneven[uneven.length - 1].balance).toBe(0);
    expect(summarizeSchedule(uneven).totalPaid).toBeCloseTo(100, 8);
  });

  it("keeps every payment split additive (principal + interest + extra)", () => {
    const rows = buildAmortizationSchedule({
      principal: 50000,
      annualRate: 0.0725,
      termMonths: 84,
      extraMonthlyPayment: 150,
    });
    let balance = 50000;
    for (const row of rows) {
      expect(row.payment).toBeCloseTo(
        row.principal + row.extraPrincipal + row.interest,
        8
      );
      balance -= row.principal + row.extraPrincipal;
      expect(row.balance).toBeCloseTo(Math.max(0, balance), 6);
    }
  });

  it("throws when the payment can never cover the interest", () => {
    // Negative amortization guard: tiny term forces a huge rate? Instead use
    // a schedule where interest exceeds payment via an absurd rate on a long
    // term is impossible here; construct directly: 100% monthly-ish rate.
    expect(() =>
      buildAmortizationSchedule({
        principal: 100000,
        annualRate: 24, // 200% monthly
        termMonths: 360,
      })
    ).toThrow(RangeError);
  });
});
