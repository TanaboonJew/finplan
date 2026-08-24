import { MONTHS_PER_YEAR } from "./constants";
import { assertFiniteNumber, assertPositiveInteger } from "./validation";

export function aprToMonthlyRate(apr: number): number {
  assertFiniteNumber(apr, "apr");
  return apr / MONTHS_PER_YEAR;
}

export function monthlyRateToApr(monthlyRate: number): number {
  assertFiniteNumber(monthlyRate, "monthlyRate");
  return monthlyRate * MONTHS_PER_YEAR;
}

export function aprToEffectiveAnnualRate(
  apr: number,
  compoundingPeriodsPerYear = MONTHS_PER_YEAR
): number {
  assertFiniteNumber(apr, "apr");
  assertPositiveInteger(compoundingPeriodsPerYear, "compoundingPeriodsPerYear");
  const periodic = apr / compoundingPeriodsPerYear;
  if (periodic <= -1) {
    throw new RangeError(
      `apr of ${apr} is invalid for ${compoundingPeriodsPerYear} compounding periods per year`
    );
  }
  return Math.pow(1 + periodic, compoundingPeriodsPerYear) - 1;
}

export function effectiveAnnualToApr(
  effectiveAnnualRate: number,
  compoundingPeriodsPerYear = MONTHS_PER_YEAR
): number {
  assertFiniteNumber(effectiveAnnualRate, "effectiveAnnualRate");
  if (effectiveAnnualRate <= -1) {
    throw new RangeError(
      `effectiveAnnualRate must be greater than -1, got ${effectiveAnnualRate}`
    );
  }
  assertPositiveInteger(compoundingPeriodsPerYear, "compoundingPeriodsPerYear");
  return (
    (Math.pow(1 + effectiveAnnualRate, 1 / compoundingPeriodsPerYear) - 1) *
    compoundingPeriodsPerYear
  );
}
