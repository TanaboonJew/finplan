import {
  assertFiniteNumber,
  assertNonNegative,
  assertNonNegativeInteger,
} from "./validation";

export interface TimelineGoal {
  id: string;
  name: string;
  category: string;
  startAge: number;
  endAge: number;
  totalCost: number;
  monthlySavings: number;
  annualReturnRate: number;
  inflationRate: number;
}

export interface Conflict {
  goalA: string;
  goalB: string;
  overlapStart: number;
  overlapEnd: number;
  monthlyDemand: number;
  gap: number;
}

export interface CashFlowResult {
  months: number[];
  budgetLine: number[];
  demandLine: number[];
  balanceLine: number[];
}

function toYears(startAge: number, endAge: number): number {
  return Math.max(0, endAge - startAge);
}

export function goalNominalCost(
  goal: TimelineGoal,
  currentAge: number
): number {
  assertNonNegative(goal.totalCost, "goal.totalCost");
  assertFiniteNumber(goal.inflationRate, "goal.inflationRate");
  if (goal.inflationRate < -1) {
    throw new RangeError(
      `inflationRate must be greater than -1, got ${goal.inflationRate}`
    );
  }
  const years = toYears(currentAge, goal.endAge);
  if (years === 0) return goal.totalCost;
  return goal.totalCost * Math.pow(1 + goal.inflationRate, years);
}

export function goalProjectedSavings(
  goal: TimelineGoal,
  currentAge: number
): number {
  assertNonNegative(goal.monthlySavings, "goal.monthlySavings");
  assertFiniteNumber(goal.annualReturnRate, "goal.annualReturnRate");
  if (goal.annualReturnRate < -1) {
    throw new RangeError(
      `annualReturnRate must be greater than -1, got ${goal.annualReturnRate}`
    );
  }
  const months = toYears(currentAge, goal.endAge) * 12;
  assertNonNegativeInteger(months, "months");
  if (months === 0) return 0;
  const monthlyRate = goal.annualReturnRate / 12;
  if (monthlyRate === 0) return goal.monthlySavings * months;
  return (
    goal.monthlySavings *
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  );
}

export function goalShortfall(
  projected: number,
  nominalCost: number
): number {
  const diff = nominalCost - projected;
  return diff > 0 ? diff : 0;
}

export function detectConflicts(
  goals: readonly TimelineGoal[],
  monthlyBudget: number
): Conflict[] {
  assertNonNegative(monthlyBudget, "monthlyBudget");
  const conflicts: Conflict[] = [];

  for (let i = 0; i < goals.length; i++) {
    for (let j = i + 1; j < goals.length; j++) {
      const a = goals[i]!;
      const b = goals[j]!;
      const overlapStart = Math.max(a.startAge, b.startAge);
      const overlapEnd = Math.min(a.endAge, b.endAge);
      if (overlapStart >= overlapEnd) continue;

      const monthlyDemand = a.monthlySavings + b.monthlySavings;
      const gap = monthlyDemand - monthlyBudget;
      if (gap > 0) {
        conflicts.push({
          goalA: a.id,
          goalB: b.id,
          overlapStart,
          overlapEnd,
          monthlyDemand,
          gap,
        });
      }
    }
  }

  return conflicts;
}

export function totalMonthlyDemand(
  goals: readonly TimelineGoal[],
  age: number
): number {
  let total = 0;
  for (const goal of goals) {
    if (age >= goal.startAge && age < goal.endAge) {
      total += goal.monthlySavings;
    }
  }
  return total;
}

export function combinedCashFlow(
  goals: readonly TimelineGoal[],
  monthlyBudget: number,
  currentAge: number
): CashFlowResult {
  assertNonNegative(monthlyBudget, "monthlyBudget");
  if (goals.length === 0) {
    return { months: [], budgetLine: [], demandLine: [], balanceLine: [] };
  }

  let maxEndAge = 0;
  for (const goal of goals) {
    if (goal.endAge > maxEndAge) maxEndAge = goal.endAge;
  }

  const totalMonths = Math.max(1, (maxEndAge - currentAge) * 12 + 1);
  const months: number[] = [];
  const budgetLine: number[] = [];
  const demandLine: number[] = [];
  const balanceLine: number[] = [];
  let balance = 0;

  for (let m = 0; m < totalMonths; m += 1) {
    const age = currentAge + m / 12;
    const demand = totalMonthlyDemand(goals, age);
    const surplus = monthlyBudget - demand;
    balance += surplus;

    months.push(Math.round(age * 12));
    budgetLine.push(monthlyBudget);
    demandLine.push(demand);
    balanceLine.push(balance);
  }

  return { months, budgetLine, demandLine, balanceLine };
}
