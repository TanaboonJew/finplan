import { assertFiniteNumber } from "./validation";

export function netPresentValue(
  rate: number,
  cashFlows: readonly number[]
): number {
  assertFiniteNumber(rate, "rate");
  if (rate <= -1) {
    throw new RangeError(`rate must be greater than -1, got ${rate}`);
  }
  cashFlows.forEach((flow, index) => {
    assertFiniteNumber(flow, `cashFlows[${index}]`);
  });
  return cashFlows.reduce(
    (sum, flow, period) => sum + flow / Math.pow(1 + rate, period),
    0
  );
}

const IRR_TOLERANCE = 1e-9;
const IRR_MAX_ITERATIONS = 100;
const IRR_BRACKET_MIN = -0.999999;
const IRR_BRACKET_MAX = 10;
const IRR_BRACKET_STEPS = 2000;

export function internalRateOfReturn(
  cashFlows: readonly number[],
  guess = 0.1
): number {
  assertFiniteNumber(guess, "guess");
  if (guess <= -1) {
    throw new RangeError(`guess must be greater than -1, got ${guess}`);
  }
  cashFlows.forEach((flow, index) => {
    assertFiniteNumber(flow, `cashFlows[${index}]`);
  });

  const hasPositive = cashFlows.some((flow) => flow > 0);
  const hasNegative = cashFlows.some((flow) => flow < 0);
  if (!hasPositive || !hasNegative) {
    throw new RangeError(
      "IRR requires at least one positive and one negative cash flow"
    );
  }

  const newtonResult = tryNewtonRaphson(cashFlows, guess);
  if (newtonResult !== null) return newtonResult;

  const bisectionResult = tryBisection(cashFlows);
  if (bisectionResult !== null) return bisectionResult;

  throw new RangeError("IRR did not converge for the given cash flows");
}

function npvDerivative(rate: number, cashFlows: readonly number[]): number {
  return cashFlows.reduce(
    (sum, flow, period) =>
      period === 0
        ? sum
        : sum - (period * flow) / Math.pow(1 + rate, period + 1),
    0
  );
}

function tryNewtonRaphson(
  cashFlows: readonly number[],
  guess: number
): number | null {
  let rate = guess;
  for (let i = 0; i < IRR_MAX_ITERATIONS; i += 1) {
    const value = netPresentValue(rate, cashFlows);
    const derivative = npvDerivative(rate, cashFlows);
    if (Math.abs(derivative) < IRR_TOLERANCE) return null;
    const nextRate = rate - value / derivative;
    if (nextRate <= -1) return null;
    if (Math.abs(nextRate - rate) < IRR_TOLERANCE) {
      return Math.abs(netPresentValue(nextRate, cashFlows)) < 1e-6
        ? nextRate
        : null;
    }
    rate = nextRate;
  }
  return null;
}

function tryBisection(cashFlows: readonly number[]): number | null {
  const step = (IRR_BRACKET_MAX - IRR_BRACKET_MIN) / IRR_BRACKET_STEPS;
  let left = IRR_BRACKET_MIN;
  let leftValue = netPresentValue(left, cashFlows);
  for (let i = 1; i <= IRR_BRACKET_STEPS; i += 1) {
    const right = IRR_BRACKET_MIN + i * step;
    const rightValue = netPresentValue(right, cashFlows);
    if (leftValue === 0) return left;
    if (leftValue * rightValue < 0) {
      return bisect(cashFlows, left, right);
    }
    left = right;
    leftValue = rightValue;
  }
  return null;
}

function bisect(
  cashFlows: readonly number[],
  low: number,
  high: number
): number {
  let lo = low;
  let hi = high;
  let mid = lo;
  for (let i = 0; i < IRR_MAX_ITERATIONS; i += 1) {
    mid = (lo + hi) / 2;
    const value = netPresentValue(mid, cashFlows);
    if (Math.abs(value) < IRR_TOLERANCE || (hi - lo) / 2 < IRR_TOLERANCE) {
      return mid;
    }
    if (netPresentValue(lo, cashFlows) * value < 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return mid;
}
