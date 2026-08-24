import { describe, expect, it } from "vitest";
import {
  aprToEffectiveAnnualRate,
  aprToMonthlyRate,
  effectiveAnnualToApr,
  monthlyRateToApr,
} from "@/lib/finance/rates";

describe("rates", () => {
  it("converts APR to a monthly periodic rate", () => {
    expect(aprToMonthlyRate(0.12)).toBeCloseTo(0.01, 12);
    expect(aprToMonthlyRate(0)).toBe(0);
  });

  it("round-trips APR through monthly rate", () => {
    expect(monthlyRateToApr(aprToMonthlyRate(0.0725))).toBeCloseTo(0.0725, 12);
  });

  it("computes effective annual rate from nominal APR", () => {
    expect(aprToEffectiveAnnualRate(0.12)).toBeCloseTo(0.12682503, 7);
    expect(aprToEffectiveAnnualRate(0.12, 1)).toBeCloseTo(0.12, 12);
    expect(aprToEffectiveAnnualRate(0.12, 365)).toBeCloseTo(0.12747461, 7);
  });

  it("inverts effective annual rate back to APR", () => {
    const ear = aprToEffectiveAnnualRate(0.09);
    expect(effectiveAnnualToApr(ear)).toBeCloseTo(0.09, 10);
  });

  it("rejects invalid compounding periods and rates", () => {
    expect(() => aprToEffectiveAnnualRate(0.12, 0)).toThrow(RangeError);
    expect(() => aprToEffectiveAnnualRate(-13.2, 12)).toThrow(RangeError);
    expect(() => effectiveAnnualToApr(-2, 12)).toThrow(RangeError);
    expect(() => aprToMonthlyRate(Number.NaN)).toThrow(RangeError);
  });
});
