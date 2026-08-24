import { EPSILON } from "./constants";
import {
  assertFiniteNumber,
  assertNonNegative,
  assertPositiveInteger,
} from "./validation";

export interface Debt {
  id: string;
  balance: number;
  annualRate: number;
  minimumPayment: number;
}

export type PayoffStrategy = "snowball" | "avalanche" | "hybrid";

export const PAYOFF_STRATEGIES: readonly PayoffStrategy[] = [
  "snowball",
  "avalanche",
  "hybrid",
];

export const DEFAULT_HIGH_INTEREST_APR_THRESHOLD = 0.1;

export const DEFAULT_MAX_MONTHS = 600;

export interface PayoffOptions {
  strategy: PayoffStrategy;
  extraMonthlyPayment?: number;
  highInterestAprThreshold?: number;
  maxMonths?: number;
}

export interface PayoffMonthRecord {
  month: number;
  totalBalance: number;
  interestPaid: number;
  principalPaid: number;
}

export interface PayoffResult {
  strategy: PayoffStrategy;
  monthsToPayoff: number;
  totalInterest: number;
  totalPaid: number;
  payoffOrder: string[];
  payoffMonthById: Record<string, number>;
  monthly: PayoffMonthRecord[];
}

interface WorkingDebt extends Debt {
  paidOff: boolean;
}

function validateDebts(debts: readonly Debt[]): void {
  const seen = new Set<string>();
  for (const debt of debts) {
    if (typeof debt.id !== "string" || debt.id.length === 0) {
      throw new RangeError("every debt needs a non-empty string id");
    }
    if (seen.has(debt.id)) {
      throw new RangeError(`duplicate debt id "${debt.id}"`);
    }
    seen.add(debt.id);
    assertNonNegative(debt.balance, `balance for debt "${debt.id}"`);
    assertFiniteNumber(debt.annualRate, `annualRate for debt "${debt.id}"`);
    assertNonNegative(
      debt.minimumPayment,
      `minimumPayment for debt "${debt.id}"`
    );
  }
}

function orderForStrategy(
  debts: readonly WorkingDebt[],
  strategy: PayoffStrategy,
  highInterestAprThreshold: number
): WorkingDebt[] {
  const bySmallestBalance = (a: WorkingDebt, b: WorkingDebt) =>
    a.balance - b.balance || a.annualRate - b.annualRate;
  const byHighestRate = (a: WorkingDebt, b: WorkingDebt) =>
    b.annualRate - a.annualRate || a.balance - b.balance;

  switch (strategy) {
    case "snowball":
      return [...debts].sort(bySmallestBalance);
    case "avalanche":
      return [...debts].sort(byHighestRate);
    case "hybrid": {
      const high = debts
        .filter((d) => d.annualRate >= highInterestAprThreshold)
        .sort(byHighestRate);
      const low = debts
        .filter((d) => d.annualRate < highInterestAprThreshold)
        .sort(bySmallestBalance);
      return [...high, ...low];
    }
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function simulatePayoff(
  debts: readonly Debt[],
  options: PayoffOptions
): PayoffResult {
  validateDebts(debts);
  const { strategy } = options;
  const extraMonthlyPayment = assertNonNegative(
    options.extraMonthlyPayment ?? 0,
    "extraMonthlyPayment"
  );
  const highInterestAprThreshold = assertNonNegative(
    options.highInterestAprThreshold ?? DEFAULT_HIGH_INTEREST_APR_THRESHOLD,
    "highInterestAprThreshold"
  );
  const maxMonths = assertPositiveInteger(
    options.maxMonths ?? DEFAULT_MAX_MONTHS,
    "maxMonths"
  );

  const working: WorkingDebt[] = debts
    .filter((d) => d.balance > EPSILON)
    .map((d) => ({ ...d, paidOff: false }));

  const payoffOrder: string[] = [];
  const payoffMonthById: Record<string, number> = {};
  const monthly: PayoffMonthRecord[] = [];
  let totalInterest = 0;

  let month = 0;
  while (working.some((d) => !d.paidOff)) {
    if (month >= maxMonths) {
      throw new RangeError(
        `payoff simulation did not finish within ${maxMonths} months; ` +
          "check that minimum payments cover accruing interest"
      );
    }
    month += 1;

    let interestThisMonth = 0;
    for (const debt of working) {
      if (debt.paidOff) continue;
      const accrued = debt.balance * (debt.annualRate / 12);
      debt.balance += accrued;
      interestThisMonth += accrued;
    }
    totalInterest += interestThisMonth;

    let budget =
      extraMonthlyPayment +
      working.reduce(
        (sum, d) => (d.paidOff ? sum : sum + d.minimumPayment),
        0
      );

    const active = orderForStrategy(
      working.filter((d) => !d.paidOff),
      strategy,
      highInterestAprThreshold
    );

    let principalThisMonth = 0;
    const applyPayment = (debt: WorkingDebt, amount: number) => {
      const applied = Math.min(amount, debt.balance);
      debt.balance -= applied;
      budget -= applied;
      principalThisMonth += applied;
      if (debt.balance <= EPSILON) {
        debt.balance = 0;
        debt.paidOff = true;
        payoffOrder.push(debt.id);
        payoffMonthById[debt.id] = month;
      }
    };

    for (const debt of active) {
      if (budget <= EPSILON) break;
      applyPayment(debt, Math.min(debt.minimumPayment, budget));
    }
    for (const debt of active) {
      if (budget <= EPSILON) break;
      if (!debt.paidOff) applyPayment(debt, budget);
    }

    if (
      working.some((d) => !d.paidOff) &&
      principalThisMonth <= EPSILON &&
      budget <= EPSILON
    ) {
      throw new RangeError(
        "debts cannot be repaid: no funds left to reduce balances"
      );
    }

    const totalBalance = working.reduce((sum, d) => sum + d.balance, 0);
    monthly.push({
      month,
      totalBalance: round2(Math.max(totalBalance, 0)),
      interestPaid: round2(interestThisMonth),
      principalPaid: round2(principalThisMonth),
    });
  }

  const totalPaid = monthly.reduce(
    (sum, record) => sum + record.principalPaid,
    0
  );

  return {
    strategy,
    monthsToPayoff: month,
    totalInterest: round2(totalInterest),
    totalPaid: round2(totalPaid),
    payoffOrder,
    payoffMonthById,
    monthly,
  };
}

export function compareStrategies(
  debts: readonly Debt[],
  options?: Omit<PayoffOptions, "strategy">
): Record<PayoffStrategy, PayoffResult> {
  const results = {} as Record<PayoffStrategy, PayoffResult>;
  for (const strategy of PAYOFF_STRATEGIES) {
    results[strategy] = simulatePayoff(debts, { ...options, strategy });
  }
  return results;
}
