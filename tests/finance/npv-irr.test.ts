import { describe, expect, it } from "vitest";
import {
  internalRateOfReturn,
  netPresentValue,
} from "@/lib/finance/npv-irr";

describe("npv-irr", () => {
  it("discounts cash flows with the first flow at t=0", () => {
    expect(netPresentValue(0.1, [-1000, 500, 500, 500])).toBeCloseTo(
      243.43,
      1
    );
    expect(netPresentValue(0, [100, 200, -50])).toBe(250);
    expect(netPresentValue(0.1, [100])).toBe(100);
  });

  it("rejects invalid rates and flows", () => {
    expect(() => netPresentValue(-1.5, [1])).toThrow(RangeError);
    expect(() => netPresentValue(0.1, [Number.NaN])).toThrow(RangeError);
  });

  it("finds the exact IRR of a simple investment", () => {
    expect(internalRateOfReturn([-100, 110])).toBeCloseTo(0.1, 6);
  });

  it("finds an IRR that zeroes the NPV", () => {
    const flows = [-1000, 500, 500, 500];
    const rate = internalRateOfReturn(flows);
    expect(rate).toBeGreaterThan(0.2);
    expect(rate).toBeLessThan(0.25);
    expect(netPresentValue(rate, flows)).toBeCloseTo(0, 5);
  });

  it("converges even from a bad initial guess", () => {
    const flows = [-1000, 500, 500, 500];
    const rate = internalRateOfReturn(flows, 5);
    expect(netPresentValue(rate, flows)).toBeCloseTo(0, 4);
  });

  it("throws without a sign change", () => {
    expect(() => internalRateOfReturn([1, 2, 3])).toThrow(RangeError);
    expect(() => internalRateOfReturn([-3, -2, -1])).toThrow(RangeError);
  });
});
