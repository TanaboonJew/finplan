import { describe, expect, it } from "vitest";
import { projectCashFlow } from "@/lib/finance/flow";
import { createFlowDemoSnapshot } from "@/lib/demo/flow";

describe("flow demo seed", () => {
  it("produces a complete snapshot", () => {
    const snapshot = createFlowDemoSnapshot(new Date(Date.UTC(2026, 7, 24)));
    expect(snapshot.streams.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.horizonMonths).toBe(12);
    expect(snapshot.currency).toBe("USD");
    expect(snapshot.startingBalance).toBe(5000);

    const incomeStreams = snapshot.streams.filter((s) => s.category === "income");
    const expenseStreams = snapshot.streams.filter((s) => s.category === "expense");
    expect(incomeStreams.length).toBeGreaterThanOrEqual(2);
    expect(expenseStreams.length).toBeGreaterThanOrEqual(3);
  });

  it("has realistic amounts", () => {
    const snapshot = createFlowDemoSnapshot();
    for (const stream of snapshot.streams) {
      expect(stream.id).toBeTruthy();
      expect(stream.name.length).toBeGreaterThan(0);
      expect(stream.amount).toBeGreaterThan(0);
      expect(stream.startMonth).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("is valid under projectCashFlow", () => {
    const snapshot = createFlowDemoSnapshot(new Date(Date.UTC(2026, 7, 24)));
    const points = projectCashFlow(
      snapshot.streams,
      snapshot.startingBalance,
      snapshot.horizonMonths,
      snapshot.startingBalance > 0 ? "2026-08" : "2026-08"
    );
    expect(points).toHaveLength(snapshot.horizonMonths);

    const totalIncome = snapshot.streams
      .filter((s) => s.category === "income")
      .reduce((sum, s) => sum + s.amount, 0);
    const totalExpense = snapshot.streams
      .filter((s) => s.category === "expense")
      .reduce((sum, s) => sum + s.amount, 0);

    expect(totalIncome).toBeGreaterThan(0);
    expect(totalExpense).toBeGreaterThan(0);
    expect(points[0]?.totalIncome).toBeCloseTo(totalIncome, 0);
    expect(points[0]?.totalExpense).toBeCloseTo(totalExpense, 0);
  });
});
