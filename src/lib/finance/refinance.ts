import { assertNonNegative, assertPositive, assertPositiveInteger } from "./validation";
import { monthlyPayment, buildAmortizationSchedule, summarizeSchedule } from "./amortization";

export interface RefinanceLoanParams {
  principal: number;
  annualRate: number;
  termMonths: number;
}

export interface RefinanceBreakEvenResult {
  currentMonthlyPayment: number;
  newMonthlyPayment: number;
  monthlySaving: number;
  closingCost: number;
  breakEvenMonths: number | null;
  totalSavingsOverNewTerm: number;
  totalSavingsOverOldTerm: number;
}

export function computeRefinanceBreakEven(
  currentLoan: RefinanceLoanParams,
  newLoan: RefinanceLoanParams,
  closingCost: number
): RefinanceBreakEvenResult {
  assertPositive(currentLoan.principal, "currentLoan.principal");
  assertPositiveInteger(currentLoan.termMonths, "currentLoan.termMonths");
  assertNonNegative(currentLoan.annualRate, "currentLoan.annualRate");
  assertPositive(newLoan.termMonths, "newLoan.termMonths");
  assertNonNegative(newLoan.annualRate, "newLoan.annualRate");
  assertNonNegative(closingCost, "closingCost");

  const currentMonthly = monthlyPayment(
    currentLoan.principal,
    currentLoan.annualRate,
    currentLoan.termMonths
  );
  const newMonthly = monthlyPayment(
    currentLoan.principal,
    newLoan.annualRate,
    newLoan.termMonths
  );

  const monthlySaving = currentMonthly - newMonthly;

  const breakEvenMonths =
    monthlySaving > 0 ? Math.ceil(closingCost / monthlySaving) : null;

  const currentSchedule = buildAmortizationSchedule({
    principal: currentLoan.principal,
    annualRate: currentLoan.annualRate,
    termMonths: currentLoan.termMonths,
  });
  const currentSummary = summarizeSchedule(currentSchedule);

  const newSchedule = buildAmortizationSchedule({
    principal: currentLoan.principal,
    annualRate: newLoan.annualRate,
    termMonths: newLoan.termMonths,
  });
  const newSummary = summarizeSchedule(newSchedule);

  const totalSavingsOverNewTerm =
    currentSummary.totalPaid - newSummary.totalPaid - closingCost;

  const comparisonMonths = Math.min(
    currentLoan.termMonths,
    newLoan.termMonths
  );
  const totalSavingsOverOldTerm =
    monthlySaving * comparisonMonths - closingCost;

  return {
    currentMonthlyPayment: currentMonthly,
    newMonthlyPayment: newMonthly,
    monthlySaving,
    closingCost,
    breakEvenMonths,
    totalSavingsOverNewTerm,
    totalSavingsOverOldTerm,
  };
}
