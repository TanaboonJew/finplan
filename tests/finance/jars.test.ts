import { describe, expect, it } from "vitest";
import {
  allocateIncome,
  computeJarActivity,
  isJarReferenced,
  summarizeJars,
  validateJarSplit,
  type JarExpenseEntry,
  type JarIncomeEntry,
  type JarSplit,
  type JarTransferEntry,
} from "@/lib/finance/jars";

const classicSplits: JarSplit[] = [
  { id: "nec", allocationPercent: 0.55 },
  { id: "ffa", allocationPercent: 0.1 },
  { id: "edu", allocationPercent: 0.1 },
  { id: "lts", allocationPercent: 0.1 },
  { id: "play", allocationPercent: 0.1 },
  { id: "give", allocationPercent: 0.05 },
];

describe("allocateIncome", () => {
  it("splits income by percent weights", () => {
    const result = allocateIncome(1000, classicSplits);
    expect(result).toEqual([
      { jarId: "nec", amount: 550 },
      { jarId: "ffa", amount: 100 },
      { jarId: "edu", amount: 100 },
      { jarId: "lts", amount: 100 },
      { jarId: "play", amount: 100 },
      { jarId: "give", amount: 50 },
    ]);
  });

  it("normalizes splits that do not sum to 1", () => {
    const result = allocateIncome(300, [
      { id: "a", allocationPercent: 3 },
      { id: "b", allocationPercent: 1 },
    ]);
    expect(result.map((r) => r.amount)).toEqual([225, 75]);
  });

  it("keeps allocated cents exactly equal to the income amount", () => {
    for (const amount of [0.01, 0.07, 123.45, 999.99, 4321.1]) {
      const result = allocateIncome(amount, [
        { id: "a", allocationPercent: 0.33 },
        { id: "b", allocationPercent: 0.33 },
        { id: "c", allocationPercent: 0.34 },
      ]);
      const total = result.reduce((sum, r) => sum + r.amount, 0);
      expect(total).toBeCloseTo(amount, 10);
      for (const part of result) {
        expect(part.amount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("gives leftover cents to the largest fractional share first", () => {
    const result = allocateIncome(0.03, [
      { id: "a", allocationPercent: 1 },
      { id: "b", allocationPercent: 1 },
      { id: "c", allocationPercent: 1 },
    ]);
    expect(result.map((r) => r.amount)).toEqual([0.01, 0.01, 0.01]);

    const uneven = allocateIncome(0.01, [
      { id: "big", allocationPercent: 2 },
      { id: "small", allocationPercent: 1 },
    ]);
    expect(uneven).toEqual([{ jarId: "big", amount: 0.01 }]);
  });

  it("omits zero-amount allocations instead of storing empty rows", () => {
    const result = allocateIncome(100, [
      { id: "funded", allocationPercent: 1 },
      { id: "zero", allocationPercent: 0 },
    ]);
    expect(result).toEqual([{ jarId: "funded", amount: 100 }]);
  });

  it("returns no allocations without throwing when the amount is zero", () => {
    expect(allocateIncome(0, classicSplits)).toEqual([]);
  });

  it("rejects invalid amounts and percentages", () => {
    expect(() => allocateIncome(-5, classicSplits)).toThrow(RangeError);
    expect(() => allocateIncome(Number.NaN, classicSplits)).toThrow(RangeError);
    expect(() =>
      allocateIncome(10, [{ id: "a", allocationPercent: -0.1 }])
    ).toThrow(RangeError);
    expect(() => allocateIncome(10, [])).toThrow(RangeError);
    expect(() =>
      allocateIncome(10, [
        { id: "a", allocationPercent: 0 },
        { id: "b", allocationPercent: 0 },
      ])
    ).toThrow(RangeError);
  });
});

const incomes: JarIncomeEntry[] = [
  {
    id: "inc-1",
    amount: 1000,
    date: "2026-08-01",
    note: "salary",
    allocations: [
      { jarId: "nec", amount: 550 },
      { jarId: "ffa", amount: 450 },
    ],
  },
];

const expenses: JarExpenseEntry[] = [
  {
    id: "exp-1",
    jarId: "nec",
    amount: 120,
    date: "2026-08-02",
    note: "groceries",
  },
];

const transfers: JarTransferEntry[] = [
  {
    id: "tr-1",
    fromJarId: "ffa",
    toJarId: "lts",
    amount: 200,
    date: "2026-08-03",
    note: "top up savings",
  },
];

describe("computeJarActivity", () => {
  it("computes balances from allocations, spending and transfers", () => {
    const activity = computeJarActivity(incomes, expenses, transfers);

    expect(activity.get("nec")).toEqual({
      allocated: 550,
      spent: 120,
      transferredIn: 0,
      transferredOut: 0,
      balance: 430,
    });
    expect(activity.get("ffa")).toEqual({
      allocated: 450,
      spent: 0,
      transferredIn: 0,
      transferredOut: 200,
      balance: 250,
    });
    expect(activity.get("lts")?.balance).toBe(200);
  });

  it("ignores entries with no activity and tolerates unknown jar ids", () => {
    const activity = computeJarActivity(
      [
        {
          id: "inc-old",
          amount: 50,
          date: "2026-01-01",
          note: "",
          allocations: [{ jarId: "deleted-jar", amount: 50 }],
        },
      ],
      [],
      []
    );
    expect(activity.size).toBe(1);
    expect(activity.get("deleted-jar")?.balance).toBe(50);
  });

  it("returns an empty map when there are no entries", () => {
    expect(computeJarActivity([], [], []).size).toBe(0);
  });
});

describe("isJarReferenced", () => {
  it("detects usage across all entry kinds", () => {
    expect(isJarReferenced("nec", incomes, expenses, transfers)).toBe(true);
    expect(isJarReferenced("ffa", incomes, expenses, transfers)).toBe(true);
    expect(isJarReferenced("lts", incomes, expenses, transfers)).toBe(true);
    expect(isJarReferenced("unused", incomes, expenses, transfers)).toBe(false);
  });
});

describe("summarizeJars", () => {
  it("totals income, spending and transfers; transfers stay internal", () => {
    const summary = summarizeJars(incomes, expenses, transfers);
    expect(summary.totalIncome).toBe(1000);
    expect(summary.totalSpent).toBe(120);
    expect(summary.totalTransferred).toBe(200);
    expect(summary.netOnHand).toBe(880);
  });

  it("handles an empty ledger", () => {
    expect(summarizeJars([], [], [])).toEqual({
      totalIncome: 0,
      totalSpent: 0,
      totalTransferred: 0,
      netOnHand: 0,
    });
  });
});

describe("validateJarSplit", () => {
  it("accepts a split that sums to 100%", () => {
    expect(validateJarSplit(classicSplits)).toEqual({
      totalPercent: 1,
      isValid: true,
    });
  });

  it("flags incomplete or overflowing splits", () => {
    expect(validateJarSplit([{ id: "a", allocationPercent: 0.9 }])).toEqual({
      totalPercent: 0.9,
      isValid: false,
    });
    expect(validateJarSplit([]).isValid).toBe(false);
  });

  it("tolerates floating point drift", () => {
    const drifting: JarSplit[] = [
      { id: "a", allocationPercent: 1 / 3 },
      { id: "b", allocationPercent: 1 / 3 },
      { id: "c", allocationPercent: 1 / 3 },
    ];
    expect(validateJarSplit(drifting).isValid).toBe(true);
  });

  it("rejects negative percents", () => {
    expect(() =>
      validateJarSplit([{ id: "a", allocationPercent: -0.5 }])
    ).toThrow(RangeError);
  });
});
