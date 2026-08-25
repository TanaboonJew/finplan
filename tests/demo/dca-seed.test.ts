import { describe, expect, it } from "vitest";
import { computeDcaSchedule, compareDcaFunds, type DcaFundParams } from "@/lib/finance/dca";
import { createDcaDemoState } from "@/lib/demo/dca";

describe("dca demo seed", () => {
  it("produces a complete snapshot", () => {
    const snapshot = createDcaDemoState();
    expect(snapshot.funds.length).toBe(2);
    expect(snapshot.monthlyContribution).toBeGreaterThan(0);
    expect(snapshot.horizonMonths).toBeGreaterThan(0);
    expect(snapshot.currency).toBe("USD");
    for (const fund of snapshot.funds) {
      expect(fund.id).toBeTruthy();
      expect(fund.name.length).toBeGreaterThan(0);
      expect(fund.expenseRatio).toBeGreaterThanOrEqual(0);
      expect(fund.annualReturn).toBeGreaterThan(0);
    }
  });

  it("produces solvable schedules for both funds", () => {
    const snapshot = createDcaDemoState();
    const fundParams: DcaFundParams[] = snapshot.funds.map((f) => ({
      name: f.name,
      expenseRatio: f.expenseRatio,
      frontLoad: f.frontLoad,
      exitLoad: f.exitLoad,
      annualReturn: f.annualReturn,
    }));

    for (const fp of fundParams) {
      const schedule = computeDcaSchedule(
        fp,
        snapshot.monthlyContribution,
        snapshot.horizonMonths
      );
      expect(schedule).toHaveLength(snapshot.horizonMonths + 1);
      expect(schedule[snapshot.horizonMonths].balance).toBeGreaterThan(0);
    }

    const results = compareDcaFunds(
      fundParams,
      snapshot.monthlyContribution,
      snapshot.horizonMonths
    );
    expect(results).toHaveLength(2);
    for (const r of results) {
      expect(r.totalFees).toBeGreaterThan(0);
      expect(r.feeDragPercent).toBeGreaterThan(0);
    }
  });
});
