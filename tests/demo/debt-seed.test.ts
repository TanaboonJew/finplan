import { describe, expect, it } from "vitest";
import { simulatePayoff } from "@/lib/finance/payoff";
import { createDebtDemoSnapshot } from "@/lib/demo/debt";

describe("debt demo seed", () => {
  it("produces a complete snapshot", () => {
    const snapshot = createDebtDemoSnapshot(new Date(Date.UTC(2026, 7, 24)));
    expect(snapshot.debts.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.extraMonthlyPayment).toBeGreaterThan(0);
    expect(snapshot.currency).toBe("USD");
    expect(snapshot.startMonth).toBe("2026-08");
    for (const debt of snapshot.debts) {
      expect(debt.id).toBeTruthy();
      expect(debt.name.length).toBeGreaterThan(0);
      expect(debt.balance).toBeGreaterThan(0);
      expect(debt.annualRate).toBeGreaterThan(0);
      expect(debt.annualRate).toBeLessThan(1);
      expect(debt.minimumPayment).toBeGreaterThan(0);
    }
  });

  it("is solvable under every strategy", () => {
    const { debts, extraMonthlyPayment } = createDebtDemoSnapshot();
    for (const strategy of ["snowball", "avalanche", "hybrid"] as const) {
      const result = simulatePayoff(debts, {
        strategy,
        extraMonthlyPayment,
      });
      expect(result.monthsToPayoff).toBeGreaterThan(0);
      expect(result.monthsToPayoff).toBeLessThan(600);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.payoffOrder).toHaveLength(
        debts.filter((d) => d.balance > 0).length
      );
    }
  });
});
