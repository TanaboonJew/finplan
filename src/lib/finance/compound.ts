import { assertFiniteNumber, assertNonNegative, assertNonNegativeInteger } from "./validation";

export interface GrowthPoint {
  month: number;
  balance: number;
}

export interface GrowthInput {
  initialBalance: number;
  monthlyContribution: number;
  annualRate: number;
  months: number;
}

export function futureValue(
  presentValue: number,
  periodicRate: number,
  periods: number
): number {
  assertNonNegative(presentValue, "presentValue");
  assertFiniteNumber(periodicRate, "periodicRate");
  if (periodicRate <= -1) {
    throw new RangeError(`periodicRate must be greater than -1, got ${periodicRate}`);
  }
  assertNonNegative(periods, "periods");
  return presentValue * Math.pow(1 + periodicRate, periods);
}

export function presentValue(
  futureValueAmount: number,
  periodicRate: number,
  periods: number
): number {
  assertNonNegative(futureValueAmount, "futureValueAmount");
  assertFiniteNumber(periodicRate, "periodicRate");
  if (periodicRate <= -1) {
    throw new RangeError(`periodicRate must be greater than -1, got ${periodicRate}`);
  }
  assertNonNegative(periods, "periods");
  return futureValueAmount / Math.pow(1 + periodicRate, periods);
}

export function futureValueOfAnnuity(
  payment: number,
  periodicRate: number,
  periods: number
): number {
  assertNonNegative(payment, "payment");
  assertFiniteNumber(periodicRate, "periodicRate");
  if (periodicRate <= -1) {
    throw new RangeError(`periodicRate must be greater than -1, got ${periodicRate}`);
  }
  assertNonNegativeInteger(periods, "periods");
  if (periods === 0) return 0;
  if (periodicRate === 0) return payment * periods;
  return payment * ((Math.pow(1 + periodicRate, periods) - 1) / periodicRate);
}

export function presentValueOfAnnuity(
  payment: number,
  periodicRate: number,
  periods: number
): number {
  assertNonNegative(payment, "payment");
  assertFiniteNumber(periodicRate, "periodicRate");
  if (periodicRate <= -1) {
    throw new RangeError(`periodicRate must be greater than -1, got ${periodicRate}`);
  }
  assertNonNegativeInteger(periods, "periods");
  if (periods === 0) return 0;
  if (periodicRate === 0) return payment * periods;
  return payment * ((1 - Math.pow(1 + periodicRate, -periods)) / periodicRate);
}

export function projectBalance({
  initialBalance,
  monthlyContribution,
  annualRate,
  months,
}: GrowthInput): number {
  assertNonNegative(initialBalance, "initialBalance");
  assertNonNegative(monthlyContribution, "monthlyContribution");
  assertFiniteNumber(annualRate, "annualRate");
  assertNonNegativeInteger(months, "months");
  const monthlyRate = annualRate / 12;
  const grown = initialBalance * Math.pow(1 + monthlyRate, months);
  const contributed = futureValueOfAnnuity(monthlyContribution, monthlyRate, months);
  return grown + contributed;
}

export function growthSchedule({
  initialBalance,
  monthlyContribution,
  annualRate,
  months,
}: GrowthInput): GrowthPoint[] {
  assertNonNegative(initialBalance, "initialBalance");
  assertNonNegative(monthlyContribution, "monthlyContribution");
  assertFiniteNumber(annualRate, "annualRate");
  assertNonNegativeInteger(months, "months");
  const monthlyRate = annualRate / 12;
  const points: GrowthPoint[] = [{ month: 0, balance: initialBalance }];
  let balance = initialBalance;
  for (let month = 1; month <= months; month += 1) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    points.push({ month, balance });
  }
  return points;
}
