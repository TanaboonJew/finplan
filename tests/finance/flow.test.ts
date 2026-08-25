import { describe, expect, it } from "vitest";
import { projectCashFlow, type FlowStream } from "@/lib/finance/flow";

const incomeStream: FlowStream = {
  id: "salary",
  name: "Salary",
  amount: 3000,
  category: "income",
  startMonth: "2026-01",
  endMonth: null,
};

const expenseStream: FlowStream = {
  id: "rent",
  name: "Rent",
  amount: 1200,
  category: "expense",
  startMonth: "2026-01",
  endMonth: null,
};

describe("projectCashFlow", () => {
  it("returns single-point array for horizon of 1", () => {
    const result = projectCashFlow([], 0, 1, "2026-01");
    expect(result).toHaveLength(1);
  });

  it("rejects zero horizon", () => {
    expect(() => projectCashFlow([], 0, 0, "2026-01")).toThrow(RangeError);
  });

  it("computes basic income minus expense", () => {
    const result = projectCashFlow(
      [incomeStream, expenseStream],
      0,
      3,
      "2026-01"
    );
    expect(result).toHaveLength(3);
    expect(result[0].totalIncome).toBe(3000);
    expect(result[0].totalExpense).toBe(1200);
    expect(result[0].netFlow).toBe(1800);
    expect(result[0].balance).toBe(1800);
  });

  it("applies starting balance", () => {
    const result = projectCashFlow(
      [incomeStream, expenseStream],
      5000,
      1,
      "2026-01"
    );
    expect(result[0].balance).toBe(6800);
  });

  it("accumulates balance across months", () => {
    const result = projectCashFlow(
      [incomeStream, expenseStream],
      0,
      6,
      "2026-01"
    );
    expect(result[5].balance).toBe(1800 * 6);
  });

  it("handles streams with end dates", () => {
    const bonus: FlowStream = {
      id: "bonus",
      name: "Bonus",
      amount: 500,
      category: "income",
      startMonth: "2026-01",
      endMonth: "2026-02",
    };
    const result = projectCashFlow([bonus], 0, 4, "2026-01");
    expect(result[0].totalIncome).toBe(500);
    expect(result[1].totalIncome).toBe(500);
    expect(result[2].totalIncome).toBe(0);
    expect(result[3].totalIncome).toBe(0);
  });

  it("handles streams that start later", () => {
    const late: FlowStream = {
      id: "late",
      name: "Late income",
      amount: 1000,
      category: "income",
      startMonth: "2026-03",
      endMonth: null,
    };
    const result = projectCashFlow([late], 0, 5, "2026-01");
    expect(result[0].totalIncome).toBe(0);
    expect(result[1].totalIncome).toBe(0);
    expect(result[2].totalIncome).toBe(1000);
    expect(result[3].totalIncome).toBe(1000);
  });

  it("applies what-if scale adjustments", () => {
    const result = projectCashFlow(
      [incomeStream],
      0,
      1,
      "2026-01",
      [{ streamId: "salary", scale: 1.5 }]
    );
    expect(result[0].totalIncome).toBe(4500);
  });

  it("handles negative net flow (deficit)", () => {
    const result = projectCashFlow(
      [expenseStream],
      5000,
      3,
      "2026-01"
    );
    expect(result[0].netFlow).toBe(-1200);
    expect(result[0].balance).toBe(3800);
    expect(result[2].balance).toBe(1400);
  });

  it("handles zero streams", () => {
    const result = projectCashFlow([], 1000, 3, "2026-01");
    expect(result).toHaveLength(3);
    for (const pt of result) {
      expect(pt.totalIncome).toBe(0);
      expect(pt.totalExpense).toBe(0);
      expect(pt.netFlow).toBe(0);
      expect(pt.balance).toBe(1000);
    }
  });

  it("wraps across year boundary", () => {
    const result = projectCashFlow([incomeStream], 0, 3, "2026-11");
    expect(result[0].month).toBe("2026-11");
    expect(result[1].month).toBe("2026-12");
    expect(result[2].month).toBe("2027-01");
  });

  it("rejects invalid inputs", () => {
    expect(() => projectCashFlow([], -1, 1, "2026-01")).toThrow(RangeError);
    expect(() => projectCashFlow([], 0, 0.5, "2026-01")).toThrow(RangeError);
    expect(() => projectCashFlow([], 0, 1, "not-a-date")).toThrow(RangeError);
  });
});
