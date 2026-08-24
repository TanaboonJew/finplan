import { EPSILON, MONTHS_PER_YEAR } from "./constants";
import { assertFiniteNumber, assertNonNegative } from "./validation";

export type CategoryKind = "expense" | "savings";

export const CATEGORY_KINDS: readonly CategoryKind[] = ["expense", "savings"];

export function isCategoryKind(value: unknown): value is CategoryKind {
  return (
    typeof value === "string" &&
    (CATEGORY_KINDS as readonly string[]).includes(value)
  );
}

export interface BudgetCategoryLike {
  id: string;
  kind: CategoryKind;
  rolloverEnabled: boolean;
  plans: readonly number[];
}

export interface BudgetEntryLike {
  categoryId: string;
  month: number;
  amount: number;
}

export interface CategorySummary {
  categoryId: string;
  kind: CategoryKind;
  rolloverEnabled: boolean;
  planned: number[];
  actual: number[];
  available: number[];
  totalPlanned: number;
  totalActual: number;
  totalRemaining: number;
}

export interface MonthlyAggregate {
  planned: number[];
  actual: number[];
  available: number[];
}

export type HealthGrade = "great" | "good" | "fair" | "poor";

export interface BudgetHealthCell {
  planned: number;
  actual: number;
}

export interface BudgetHealth {
  score: number | null;
  grade: HealthGrade;
  cellsEvaluated: number;
  cellsOverspent: number;
  plannedTotal: number;
  actualTotal: number;
}

export function assertMonth(month: number, name = "month"): number {
  assertFiniteNumber(month, name);
  if (!Number.isInteger(month) || month < 0 || month >= MONTHS_PER_YEAR) {
    throw new RangeError(
      `${name} must be an integer between 0 and ${MONTHS_PER_YEAR - 1}, got ${String(month)}`
    );
  }
  return month;
}

function assertPlansShape(plans: readonly number[], name = "plans"): void {
  if (!Array.isArray(plans) || plans.length !== MONTHS_PER_YEAR) {
    throw new RangeError(
      `${name} must contain exactly ${MONTHS_PER_YEAR} monthly amounts`
    );
  }
  for (const amount of plans) {
    assertNonNegative(amount, `${name} entry`);
  }
}

export function emptyPlans(): number[] {
  return Array.from({ length: MONTHS_PER_YEAR }, () => 0);
}

export function foldEntriesToMonths(
  entries: readonly BudgetEntryLike[]
): Map<string, number[]> {
  const byCategory = new Map<string, number[]>();
  for (const entry of entries) {
    assertMonth(entry.month, "entry month");
    assertFiniteNumber(entry.amount, "entry amount");
    if (entry.amount < 0) {
      throw new RangeError(`entry amount must be non-negative, got ${entry.amount}`);
    }
    let months = byCategory.get(entry.categoryId);
    if (!months) {
      months = emptyPlans();
      byCategory.set(entry.categoryId, months);
    }
    months[entry.month] += entry.amount;
  }
  return byCategory;
}

export function applyRollover(
  planned: readonly number[],
  actual: readonly number[]
): number[] {
  assertPlansShape(planned, "planned");
  assertPlansShape(actual, "actual");
  const available = emptyPlans();
  for (let month = 0; month < MONTHS_PER_YEAR; month += 1) {
    available[month] =
      (month > 0 ? available[month - 1] : 0) +
      planned[month] -
      actual[month];
  }
  return available;
}

export function summarizeCategory(
  category: BudgetCategoryLike,
  actualByMonth: readonly number[]
): CategorySummary {
  assertPlansShape(category.plans, `plans for "${category.id}"`);
  assertPlansShape(actualByMonth, `actuals for "${category.id}"`);
  const available = category.rolloverEnabled
    ? applyRollover(category.plans, actualByMonth)
    : category.plans.map((planned, month) => planned - actualByMonth[month]);
  const totalPlanned = category.plans.reduce((sum, value) => sum + value, 0);
  const totalActual = actualByMonth.reduce((sum, value) => sum + value, 0);
  return {
    categoryId: category.id,
    kind: category.kind,
    rolloverEnabled: category.rolloverEnabled,
    planned: [...category.plans],
    actual: [...actualByMonth],
    available,
    totalPlanned,
    totalActual,
    totalRemaining: totalPlanned - totalActual,
  };
}

export function aggregateSummaries(
  summaries: readonly CategorySummary[]
): MonthlyAggregate {
  const planned = emptyPlans();
  const actual = emptyPlans();
  const available = emptyPlans();
  for (const summary of summaries) {
    for (let month = 0; month < MONTHS_PER_YEAR; month += 1) {
      planned[month] += summary.planned[month];
      actual[month] += summary.actual[month];
    }
  }
  for (let month = 0; month < MONTHS_PER_YEAR; month += 1) {
    available[month] = planned[month] - actual[month];
  }
  return { planned, actual, available };
}

export function buildHealthCells(
  summaries: readonly CategorySummary[]
): BudgetHealthCell[] {
  const cells: BudgetHealthCell[] = [];
  for (const summary of summaries) {
    for (let month = 0; month < MONTHS_PER_YEAR; month += 1) {
      if (summary.actual[month] > 0) {
        cells.push({
          planned: summary.planned[month],
          actual: summary.actual[month],
        });
      }
    }
  }
  return cells;
}

const GRADE_THRESHOLDS: ReadonlyArray<readonly [number, HealthGrade]> = [
  [90, "great"],
  [75, "good"],
  [60, "fair"],
];

export function gradeForScore(score: number): HealthGrade {
  for (const [minimum, grade] of GRADE_THRESHOLDS) {
    if (score >= minimum) return grade;
  }
  return "poor";
}

export function computeBudgetHealth(
  cells: readonly BudgetHealthCell[]
): BudgetHealth {
  let penaltySum = 0;
  let cellsEvaluated = 0;
  let cellsOverspent = 0;
  let plannedTotal = 0;
  let actualTotal = 0;

  for (const cell of cells) {
    assertNonNegative(cell.planned, "cell planned");
    assertNonNegative(cell.actual, "cell actual");
    const penalty =
      cell.planned > 0
        ? Math.min(1, Math.max(0, (cell.actual - cell.planned) / cell.planned))
        : 1;
    penaltySum += penalty;
    cellsEvaluated += 1;
    if (cell.actual > cell.planned + EPSILON) cellsOverspent += 1;
    plannedTotal += cell.planned;
    actualTotal += cell.actual;
  }

  if (cellsEvaluated === 0) {
    return {
      score: null,
      grade: "poor",
      cellsEvaluated: 0,
      cellsOverspent: 0,
      plannedTotal: 0,
      actualTotal: 0,
    };
  }

  const score = Math.round(100 * (1 - penaltySum / cellsEvaluated));
  return {
    score,
    grade: gradeForScore(score),
    cellsEvaluated,
    cellsOverspent,
    plannedTotal,
    actualTotal,
  };
}
