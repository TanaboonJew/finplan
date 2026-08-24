import { assertFiniteNumber, assertNonNegative } from "./validation";

export interface JarSplit {
  id: string;
  allocationPercent: number;
}

export interface JarAllocation {
  jarId: string;
  amount: number;
}

export interface JarIncomeEntry {
  id: string;
  amount: number;
  date: string;
  note: string;
  allocations: JarAllocation[];
}

export interface JarExpenseEntry {
  id: string;
  jarId: string;
  amount: number;
  date: string;
  note: string;
}

export interface JarTransferEntry {
  id: string;
  fromJarId: string;
  toJarId: string;
  amount: number;
  date: string;
  note: string;
}

export interface JarActivity {
  allocated: number;
  spent: number;
  transferredIn: number;
  transferredOut: number;
  balance: number;
}

const CENTS = 100;

export function allocateIncome(
  amount: number,
  splits: readonly JarSplit[]
): JarAllocation[] {
  assertNonNegative(amount, "amount");
  let totalPercent = 0;
  for (const split of splits) {
    assertNonNegative(split.allocationPercent, "allocationPercent");
    totalPercent += split.allocationPercent;
  }
  if (totalPercent <= 0) {
    throw new RangeError(
      "at least one split must have a positive allocationPercent"
    );
  }

  const totalCents = Math.round(amount * CENTS);
  const exactCents = splits.map(
    (split) => (totalCents * split.allocationPercent) / totalPercent
  );
  const baseCents = exactCents.map((cents) => Math.floor(cents));
  const remainders = exactCents.map((cents, index) => ({
    index,
    fraction: cents - baseCents[index],
  }));
  let centsLeft =
    totalCents - baseCents.reduce((sum, cents) => sum + cents, 0);
  remainders.sort((a, b) => b.fraction - a.fraction);
  const bonusCents = new Map<number, number>();
  for (let i = 0; centsLeft > 0 && i < remainders.length; i++, centsLeft--) {
    bonusCents.set(remainders[i].index, (bonusCents.get(remainders[i].index) ?? 0) + 1);
  }

  return splits
    .map((split, index) => ({
      jarId: split.id,
      amount:
        (baseCents[index] + (bonusCents.get(index) ?? 0)) / CENTS,
    }))
    .filter((allocation) => allocation.amount > 0);
}

function emptyActivity(): JarActivity {
  return { allocated: 0, spent: 0, transferredIn: 0, transferredOut: 0, balance: 0 };
}

export function computeJarActivity(
  incomes: readonly JarIncomeEntry[],
  expenses: readonly JarExpenseEntry[],
  transfers: readonly JarTransferEntry[]
): Map<string, JarActivity> {
  const activityById = new Map<string, JarActivity>();
  const activityFor = (jarId: string): JarActivity => {
    let activity = activityById.get(jarId);
    if (!activity) {
      activity = emptyActivity();
      activityById.set(jarId, activity);
    }
    return activity;
  };

  for (const income of incomes) {
    for (const allocation of income.allocations) {
      activityFor(allocation.jarId).allocated += allocation.amount;
    }
  }
  for (const expense of expenses) {
    activityFor(expense.jarId).spent += expense.amount;
  }
  for (const transfer of transfers) {
    activityFor(transfer.fromJarId).transferredOut += transfer.amount;
    activityFor(transfer.toJarId).transferredIn += transfer.amount;
  }
  for (const activity of activityById.values()) {
    activity.balance +=
      activity.allocated +
      activity.transferredIn -
      activity.spent -
      activity.transferredOut;
  }
  return activityById;
}

export function isJarReferenced(
  jarId: string,
  incomes: readonly JarIncomeEntry[],
  expenses: readonly JarExpenseEntry[],
  transfers: readonly JarTransferEntry[]
): boolean {
  for (const income of incomes) {
    if (income.allocations.some((a) => a.jarId === jarId)) return true;
  }
  for (const expense of expenses) {
    if (expense.jarId === jarId) return true;
  }
  for (const transfer of transfers) {
    if (transfer.fromJarId === jarId || transfer.toJarId === jarId) return true;
  }
  return false;
}

export interface JarSummary {
  totalIncome: number;
  totalSpent: number;
  totalTransferred: number;
  netOnHand: number;
}

export function summarizeJars(
  incomes: readonly JarIncomeEntry[],
  expenses: readonly JarExpenseEntry[],
  transfers: readonly JarTransferEntry[]
): JarSummary {
  const totalIncome = incomes.reduce((sum, entry) => sum + entry.amount, 0);
  const totalSpent = expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const totalTransferred = transfers.reduce(
    (sum, entry) => sum + entry.amount,
    0
  );
  return {
    totalIncome,
    totalSpent,
    totalTransferred,
    netOnHand: totalIncome - totalSpent,
  };
}

export interface JarSplitCheck {
  totalPercent: number;
  isValid: boolean;
}

export function validateJarSplit(
  jars: readonly JarSplit[],
  tolerance = 1e-9
): JarSplitCheck {
  assertFiniteNumber(tolerance, "tolerance");
  let totalPercent = 0;
  for (const jar of jars) {
    assertNonNegative(jar.allocationPercent, "allocationPercent");
    totalPercent += jar.allocationPercent;
  }
  return {
    totalPercent,
    isValid: Math.abs(totalPercent - 1) <= tolerance,
  };
}
