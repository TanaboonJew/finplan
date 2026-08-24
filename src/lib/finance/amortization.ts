import { EPSILON } from "./constants";
import {
  assertFiniteNumber,
  assertNonNegative,
  assertPositive,
  assertPositiveInteger,
} from "./validation";

export interface AmortizationRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  extraPrincipal: number;
  balance: number;
}

export interface AmortizationScheduleInput {
  principal: number;
  annualRate: number;
  termMonths: number;
  extraMonthlyPayment?: number;
}

export interface AmortizationSummary {
  months: number;
  totalPrincipal: number;
  totalInterest: number;
  totalPaid: number;
}

export function monthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  assertPositive(principal, "principal");
  assertFiniteNumber(annualRate, "annualRate");
  if (annualRate < 0) {
    throw new RangeError(`annualRate must be non-negative, got ${annualRate}`);
  }
  assertPositiveInteger(termMonths, "termMonths");
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / termMonths;
  return (
    (principal * monthlyRate) /
    (1 - Math.pow(1 + monthlyRate, -termMonths))
  );
}

export function buildAmortizationSchedule({
  principal,
  annualRate,
  termMonths,
  extraMonthlyPayment = 0,
}: AmortizationScheduleInput): AmortizationRow[] {
  assertPositive(principal, "principal");
  assertFiniteNumber(annualRate, "annualRate");
  if (annualRate < 0) {
    throw new RangeError(`annualRate must be non-negative, got ${annualRate}`);
  }
  assertPositiveInteger(termMonths, "termMonths");
  assertNonNegative(extraMonthlyPayment, "extraMonthlyPayment");

  const monthlyRate = annualRate / 12;
  const scheduledPayment = monthlyPayment(principal, annualRate, termMonths);
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let month = 1; balance > EPSILON; month += 1) {
    const interest = balance * monthlyRate;
    let principalPart = scheduledPayment - interest;
    if (principalPart <= 0) {
      throw new RangeError(
        `payment of ${scheduledPayment} never covers interest of ${interest} on this loan`
      );
    }
    if (principalPart > balance) principalPart = balance;
    const extra = Math.min(extraMonthlyPayment, balance - principalPart);
    const payment = principalPart + extra + interest;
    balance -= principalPart + extra;
    if (balance <= EPSILON) balance = 0;
    rows.push({
      month,
      payment,
      interest,
      principal: principalPart,
      extraPrincipal: extra,
      balance,
    });
  }

  return rows;
}

export function summarizeSchedule(rows: readonly AmortizationRow[]): AmortizationSummary {
  let totalPrincipal = 0;
  let totalInterest = 0;
  for (const row of rows) {
    totalPrincipal += row.principal + row.extraPrincipal;
    totalInterest += row.interest;
  }
  return {
    months: rows.length,
    totalPrincipal,
    totalInterest,
    totalPaid: totalPrincipal + totalInterest,
  };
}
