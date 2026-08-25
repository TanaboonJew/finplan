import { assertFiniteNumber, assertNonNegative, assertPositive, assertPositiveInteger } from "./validation";

export interface DcaFundParams {
  name: string;
  expenseRatio: number;
  frontLoad: number;
  exitLoad: number;
  annualReturn: number;
}

export interface DcaPoint {
  month: number;
  balance: number;
  grossBalance: number;
  cumulativeFees: number;
}

export interface DcaFundResult {
  fund: DcaFundParams;
  schedule: DcaPoint[];
  endingBalance: number;
  totalInvested: number;
  totalFees: number;
  grossEndingBalance: number;
  feeDragPercent: number;
}

function computeNetAnnualReturn(
  grossAnnualReturn: number,
  expenseRatio: number
): number {
  return (1 + grossAnnualReturn) * (1 - expenseRatio) - 1;
}

export function computeDcaSchedule(
  fund: DcaFundParams,
  monthlyContribution: number,
  horizonMonths: number
): DcaPoint[] {
  assertPositive(monthlyContribution, "monthlyContribution");
  assertPositiveInteger(horizonMonths, "horizonMonths");
  assertNonNegative(fund.expenseRatio, "fund.expenseRatio");
  assertNonNegative(fund.frontLoad, "fund.frontLoad");
  assertNonNegative(fund.exitLoad, "fund.exitLoad");
  assertFiniteNumber(fund.annualReturn, "fund.annualReturn");

  const grossMonthly = fund.annualReturn / 12;
  const netAnnual = computeNetAnnualReturn(fund.annualReturn, fund.expenseRatio);
  const netMonthly = netAnnual / 12;
  const invested = monthlyContribution * (1 - fund.frontLoad);

  const points: DcaPoint[] = [{ month: 0, balance: 0, grossBalance: 0, cumulativeFees: 0 }];
  let balance = 0;
  let grossBalance = 0;

  for (let month = 1; month <= horizonMonths; month += 1) {
    balance = balance * (1 + netMonthly) + invested;
    grossBalance = grossBalance * (1 + grossMonthly) + monthlyContribution;
    const netFinal = balance * (1 - fund.exitLoad);
    const grossFinal = grossBalance;
    points.push({
      month,
      balance: netFinal,
      grossBalance: grossFinal,
      cumulativeFees: grossFinal - netFinal,
    });
  }

  return points;
}

export function compareDcaFunds(
  funds: readonly DcaFundParams[],
  monthlyContribution: number,
  horizonMonths: number
): DcaFundResult[] {
  return funds.map((fund) => {
    const schedule = computeDcaSchedule(fund, monthlyContribution, horizonMonths);
    const endingBalance = schedule[horizonMonths].balance;
    const grossEndingBalance = schedule[horizonMonths].grossBalance;
    const totalInvested = monthlyContribution * horizonMonths;
    const totalFees = grossEndingBalance - endingBalance;
    const feeDragPercent =
      grossEndingBalance > 0 ? (totalFees / grossEndingBalance) * 100 : 0;

    return {
      fund,
      schedule,
      endingBalance,
      totalInvested,
      totalFees,
      grossEndingBalance,
      feeDragPercent,
    };
  });
}

export function computeBreakevenHorizon(
  fundA: DcaFundParams,
  fundB: DcaFundParams,
  monthlyContribution: number,
  maxMonths: number
): number | null {
  assertPositive(monthlyContribution, "monthlyContribution");
  assertPositiveInteger(maxMonths, "maxMonths");

  const netAnnualA = computeNetAnnualReturn(fundA.annualReturn, fundA.expenseRatio);
  const netAnnualB = computeNetAnnualReturn(fundB.annualReturn, fundB.expenseRatio);
  const netMonthlyA = netAnnualA / 12;
  const netMonthlyB = netAnnualB / 12;
  const investedA = monthlyContribution * (1 - fundA.frontLoad);
  const investedB = monthlyContribution * (1 - fundB.frontLoad);

  let balanceA = 0;
  let balanceB = 0;

  for (let month = 1; month <= maxMonths; month += 1) {
    balanceA = balanceA * (1 + netMonthlyA) + investedA;
    balanceB = balanceB * (1 + netMonthlyB) + investedB;

    const netA = balanceA * (1 - fundA.exitLoad);
    const netB = balanceB * (1 - fundB.exitLoad);

    if (netB > netA) {
      return month;
    }
  }

  return null;
}
