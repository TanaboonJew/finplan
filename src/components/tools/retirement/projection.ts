import {
  futureValue,
  futureValueOfAnnuity,
  growthSchedule,
  presentValue,
  projectBalance,
} from "@/lib/finance/compound";
import type { RetirementSnapshot } from "@/lib/storage/retirement-store";

export const SCENARIO_KEYS = ["bear", "base", "bull"] as const;
export type ScenarioKey = (typeof SCENARIO_KEYS)[number];

const RETURN_DELTA = 0.02;
const INFLATION_DELTA = 0.01;
const MAX_RATE = 0.5;

export interface ScenarioAssumptions {
  annualReturnRate: number;
  inflationRate: number;
}

export interface ScenarioPoint {
  age: number;
  balance: number;
}

export interface ScenarioOutcome {
  key: ScenarioKey;
  assumptions: ScenarioAssumptions;
  expenseAtRetirement: number;
  fireTarget: number;
  balanceAtRetirement: number;
  realBalanceAtRetirement: number;
  gap: number;
  series: ScenarioPoint[];
}

export interface ProjectionResult {
  yearsToRetirement: number;
  scenarios: Record<ScenarioKey, ScenarioOutcome>;
  baseFireTarget: number;
  projectedBalance: number;
  realProjectedBalance: number;
  gap: number;
  neededMonthlyContribution: number | null;
  fiAge: number | null;
}

function clampRate(value: number): number {
  return Math.min(MAX_RATE, Math.max(0, value));
}

export function scenarioAssumptions(
  base: Pick<RetirementSnapshot, "annualReturnRate" | "inflationRate">
): Record<ScenarioKey, ScenarioAssumptions> {
  return {
    bear: {
      annualReturnRate: clampRate(base.annualReturnRate - RETURN_DELTA),
      inflationRate: clampRate(base.inflationRate + INFLATION_DELTA),
    },
    base: {
      annualReturnRate: clampRate(base.annualReturnRate),
      inflationRate: clampRate(base.inflationRate),
    },
    bull: {
      annualReturnRate: clampRate(base.annualReturnRate + RETURN_DELTA),
      inflationRate: clampRate(base.inflationRate - INFLATION_DELTA),
    },
  };
}

function buildSeries(
  initialBalance: number,
  monthlyContribution: number,
  assumptions: ScenarioAssumptions,
  months: number,
  startAge: number
): ScenarioPoint[] {
  const schedule = growthSchedule({
    initialBalance,
    monthlyContribution,
    annualRate: assumptions.annualReturnRate,
    months,
  });
  const points: ScenarioPoint[] = [];
  for (let month = 0; month < schedule.length; month += 12) {
    points.push({
      age: startAge + month / 12,
      balance: schedule[month]!.balance,
    });
  }
  return points;
}

function outcomeFor(
  key: ScenarioKey,
  assumptions: ScenarioAssumptions,
  snapshot: RetirementSnapshot,
  months: number
): ScenarioOutcome {
  const years = months / 12;
  const expenseAtRetirement =
    years === 0
      ? snapshot.desiredRetirementIncome
      : futureValue(
          snapshot.desiredRetirementIncome,
          assumptions.inflationRate,
          years
        );
  const fireTarget = expenseAtRetirement / snapshot.withdrawalRate;
  const balanceAtRetirement = projectBalance({
    initialBalance: snapshot.currentSavings,
    monthlyContribution: snapshot.monthlyContribution,
    annualRate: assumptions.annualReturnRate,
    months,
  });
  const realBalanceAtRetirement =
    years === 0
      ? balanceAtRetirement
      : presentValue(
          balanceAtRetirement,
          assumptions.inflationRate,
          years
        );
  return {
    key,
    assumptions,
    expenseAtRetirement,
    fireTarget,
    balanceAtRetirement,
    realBalanceAtRetirement,
    gap: balanceAtRetirement - fireTarget,
    series: buildSeries(
      snapshot.currentSavings,
      snapshot.monthlyContribution,
      assumptions,
      months,
      snapshot.currentAge
    ),
  };
}

export function computeProjection(
  snapshot: RetirementSnapshot
): ProjectionResult {
  if (!(snapshot.withdrawalRate > 0)) {
    throw new RangeError(
      `withdrawalRate must be positive, got ${snapshot.withdrawalRate}`
    );
  }

  const years = Math.max(0, snapshot.retirementAge - snapshot.currentAge);
  const months = years * 12;
  const assumptions = scenarioAssumptions(snapshot);

  const scenarios = {
    bear: outcomeFor("bear", assumptions.bear, snapshot, months),
    base: outcomeFor("base", assumptions.base, snapshot, months),
    bull: outcomeFor("bull", assumptions.bull, snapshot, months),
  } satisfies Record<ScenarioKey, ScenarioOutcome>;

  const base = scenarios.base;
  let neededMonthlyContribution: number | null = null;
  if (months > 0 && base.fireTarget > base.balanceAtRetirement) {
    const monthlyRate = snapshot.annualReturnRate / 12;
    const annuityFactor = futureValueOfAnnuity(1, monthlyRate, months);
    const grownInitial = futureValue(
      snapshot.currentSavings,
      monthlyRate,
      months
    );
    neededMonthlyContribution = Math.max(
      0,
      (base.fireTarget - grownInitial) / annuityFactor
    );
  }

  let fiAge: number | null = null;
  const monthlyBase = growthSchedule({
    initialBalance: snapshot.currentSavings,
    monthlyContribution: snapshot.monthlyContribution,
    annualRate: assumptions.base.annualReturnRate,
    months,
  });
  for (let month = 0; month < monthlyBase.length; month += 1) {
    if (monthlyBase[month]!.balance >= base.fireTarget) {
      fiAge = snapshot.currentAge + Math.ceil(month / 12);
      break;
    }
  }

  return {
    yearsToRetirement: years,
    scenarios,
    baseFireTarget: base.fireTarget,
    projectedBalance: base.balanceAtRetirement,
    realProjectedBalance: base.realBalanceAtRetirement,
    gap: base.gap,
    neededMonthlyContribution,
    fiAge,
  };
}
