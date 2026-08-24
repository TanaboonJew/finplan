import { describe, expect, it } from "vitest";
import {
  computeProgressiveTax,
  taxableIncomeAfterDeductions,
  type TaxBand,
} from "@/lib/finance/tax";

const threeBandTable: TaxBand[] = [
  { upTo: 150000, rate: 0 },
  { upTo: 300000, rate: 0.05 },
  { upTo: null, rate: 0.1 },
];

describe("tax", () => {
  it("applies progressive bands correctly", () => {
    const result = computeProgressiveTax(400000, threeBandTable);
    expect(result.totalTax).toBeCloseTo(17500, 6);
    expect(result.marginalRate).toBeCloseTo(0.1, 12);
    expect(result.effectiveRate).toBeCloseTo(0.04375, 8);
    expect(result.bands).toHaveLength(3);
    expect(result.bands[2].taxableAmount).toBeCloseTo(100000, 6);
  });

  it("handles band boundaries exactly", () => {
    expect(computeProgressiveTax(150000, threeBandTable).totalTax).toBe(0);
    expect(computeProgressiveTax(300000, threeBandTable).totalTax).toBeCloseTo(
      7500,
      6
    );
    expect(
      computeProgressiveTax(300000.01, threeBandTable).totalTax
    ).toBeGreaterThan(7500);
  });

  it("returns zero tax below the first band", () => {
    const result = computeProgressiveTax(100000, threeBandTable);
    expect(result.totalTax).toBe(0);
    expect(result.marginalRate).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });

  it("supports a single flat band", () => {
    const result = computeProgressiveTax(200000, [{ upTo: null, rate: 0.15 }]);
    expect(result.totalTax).toBeCloseTo(30000, 6);
    expect(result.effectiveRate).toBeCloseTo(result.marginalRate, 12);
  });

  it("normalizes unsorted tables", () => {
    const unsorted: TaxBand[] = [
      { upTo: null, rate: 0.1 },
      { upTo: 150000, rate: 0 },
      { upTo: 300000, rate: 0.05 },
    ];
    expect(computeProgressiveTax(400000, unsorted).totalTax).toBeCloseTo(
      17500,
      6
    );
  });

  it("rejects invalid bracket tables", () => {
    expect(() => computeProgressiveTax(1000, [])).toThrow(RangeError);
    expect(() =>
      computeProgressiveTax(1000, [
        { upTo: null, rate: 0.1 },
        { upTo: null, rate: 0.2 },
      ])
    ).toThrow(/exactly one band/);
    expect(() =>
      computeProgressiveTax(1000, [
        { upTo: 50000, rate: 0.05 },
        { upTo: 50000, rate: 0.1 },
        { upTo: null, rate: 0.2 },
      ])
    ).toThrow(/strictly increasing/);
    expect(() =>
      computeProgressiveTax(1000, [{ upTo: null, rate: 1.5 }])
    ).toThrow(RangeError);
  });

  it("deductions reduce gross income but never below zero", () => {
    expect(taxableIncomeAfterDeductions(500000, [50000, 30000])).toBe(420000);
    expect(taxableIncomeAfterDeductions(10000, [999999])).toBe(0);
    expect(() => taxableIncomeAfterDeductions(-1, [])).toThrow(RangeError);
    expect(() => taxableIncomeAfterDeductions(1000, [-5])).toThrow(RangeError);
  });
});
