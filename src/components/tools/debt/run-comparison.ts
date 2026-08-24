import {
  compareStrategies,
  type Debt,
  type PayoffResult,
  type PayoffStrategy,
} from "@/lib/finance/payoff";
import type { DebtInput } from "@/lib/storage/debt-store";

export interface StrategyComparison {
  results: Partial<Record<PayoffStrategy, PayoffResult>>;
  error: "unsolvable" | "generic" | null;
}

export function toEngineDebts(inputs: readonly DebtInput[]): Debt[] {
  return inputs.map(({ id, balance, annualRate, minimumPayment }) => ({
    id,
    balance,
    annualRate,
    minimumPayment,
  }));
}

export function compareDebtPlans(
  inputs: readonly DebtInput[],
  extraMonthlyPayment: number
): StrategyComparison {
  if (inputs.length === 0) {
    return { results: {}, error: null };
  }
  try {
    const results = compareStrategies(toEngineDebts(inputs), {
      extraMonthlyPayment,
    });
    return { results, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return {
      results: {},
      error: /cannot be repaid|did not finish within/.test(message)
        ? "unsolvable"
        : "generic",
    };
  }
}
