import { assertNonNegative, assertRate } from "./validation";

export interface TaxBand {
  upTo: number | null;
  rate: number;
}

export interface TaxBandComputation {
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface TaxComputation {
  taxableIncome: number;
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  bands: TaxBandComputation[];
}

function normalizeBands(bands: readonly TaxBand[]): TaxBand[] {
  if (!Array.isArray(bands) || bands.length === 0) {
    throw new RangeError("tax brackets must be a non-empty array");
  }
  const sorted = [...bands].sort((a, b) => {
    if (a.upTo === null) return 1;
    if (b.upTo === null) return -1;
    return a.upTo - b.upTo;
  });

  const topLevelCount = sorted.filter((band) => band.upTo === null).length;
  if (topLevelCount !== 1) {
    throw new RangeError(
      "tax brackets must contain exactly one band with upTo set to null"
    );
  }

  let previous = 0;
  for (const band of sorted) {
    assertRate(band.rate, "band.rate");
    if (band.upTo !== null) {
      assertNonNegative(band.upTo, "band.upTo");
      if (band.upTo <= previous) {
        throw new RangeError(
          "tax bracket upper bounds must be strictly increasing"
        );
      }
      previous = band.upTo;
    }
  }
  return sorted;
}

export function computeProgressiveTax(
  taxableIncome: number,
  bands: readonly TaxBand[]
): TaxComputation {
  assertNonNegative(taxableIncome, "taxableIncome");
  const normalized = normalizeBands(bands);

  const computations: TaxBandComputation[] = [];
  let lowerBound = 0;
  let totalTax = 0;
  let marginalRate = normalized[normalized.length - 1].rate;

  for (const band of normalized) {
    if (taxableIncome <= lowerBound) break;
    const upperBound = band.upTo ?? Infinity;
    const taxableInBand =
      Math.min(taxableIncome, upperBound) - lowerBound;
    const bandTax = taxableInBand * band.rate;
    computations.push({
      rate: band.rate,
      taxableAmount: taxableInBand,
      tax: bandTax,
    });
    totalTax += bandTax;
    marginalRate = band.rate;
    lowerBound = upperBound;
  }

  return {
    taxableIncome,
    totalTax,
    effectiveRate: taxableIncome === 0 ? 0 : totalTax / taxableIncome,
    marginalRate,
    bands: computations,
  };
}

export function taxableIncomeAfterDeductions(
  grossIncome: number,
  deductions: readonly number[]
): number {
  assertNonNegative(grossIncome, "grossIncome");
  const totalDeductions = deductions.reduce((sum, deduction) => {
    assertNonNegative(deduction, "deduction");
    return sum + deduction;
  }, 0);
  return Math.max(grossIncome - totalDeductions, 0);
}
