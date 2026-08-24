import { describe, expect, it } from "vitest";
import {
  aggregateSummaries,
  applyRollover,
  buildHealthCells,
  computeBudgetHealth,
  emptyPlans,
  foldEntriesToMonths,
  gradeForScore,
  isCategoryKind,
  summarizeCategory,
} from "@/lib/finance/budget";

const PLANS = [100, 100, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0];

describe("emptyPlans", () => {
  it("returns twelve zeros", () => {
    expect(emptyPlans()).toEqual(Array(12).fill(0));
  });
});

describe("foldEntriesToMonths", () => {
  it("folds entries per category and month", () => {
    const folded = foldEntriesToMonths([
      { categoryId: "a", month: 0, amount: 10 },
      { categoryId: "a", month: 0, amount: 5.5 },
      { categoryId: "a", month: 11, amount: 3 },
      { categoryId: "b", month: 2, amount: 7 },
    ]);
    expect(folded.get("a")).toEqual([
      15.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3,
    ]);
    expect(folded.get("b")?.[2]).toBe(7);
  });

  it("rejects out-of-range months and bad amounts", () => {
    expect(() =>
      foldEntriesToMonths([{ categoryId: "a", month: 12, amount: 1 }])
    ).toThrow(RangeError);
    expect(() =>
      foldEntriesToMonths([{ categoryId: "a", month: -1, amount: 1 }])
    ).toThrow(RangeError);
    expect(() =>
      foldEntriesToMonths([{ categoryId: "a", month: 0, amount: -1 }])
    ).toThrow(RangeError);
    expect(() =>
      foldEntriesToMonths([
        { categoryId: "a", month: 0, amount: Number.NaN },
      ])
    ).toThrow(RangeError);
  });
});

describe("applyRollover", () => {
  it("accumulates unused budget when enabled", () => {
    const planned = [100, 100, 100, ...Array(9).fill(0)];
    const actual = [40, 120, 0, ...Array(9).fill(0)];
    expect(applyRollover(planned, actual).slice(0, 4)).toEqual([
      60, 40, 140, 140,
    ]);
  });

  it("resets each month when computed without rollover", () => {
    const planned = [100, 100];
    const actual = [40, 120];
    const summary = summarizeCategory(
      {
        id: "x",
        kind: "expense",
        rolloverEnabled: false,
        plans: [...planned, ...Array(10).fill(0)],
      },
      [...actual, ...Array(10).fill(0)]
    );
    expect(summary.available[0]).toBe(60);
    expect(summary.available[1]).toBe(-20);
  });

  it("keeps negative balances visible with rollover", () => {
    const available = applyRollover(
      [50, 50, ...Array(10).fill(0)],
      [80, 0, ...Array(10).fill(0)]
    );
    expect(available[0]).toBe(-30);
    expect(available[1]).toBe(20);
  });

  it("rejects malformed inputs", () => {
    expect(() => applyRollover([1, 2], Array(12).fill(0))).toThrow(RangeError);
    expect(() => applyRollover(Array(12).fill(-1), Array(12).fill(0))).toThrow(
      RangeError
    );
  });
});

describe("summarizeCategory", () => {
  const category = {
    id: "cat",
    kind: "expense" as const,
    rolloverEnabled: true,
    plans: PLANS,
  };

  it("computes totals from plans and actuals", () => {
    const actuals = [90, 110, ...Array(10).fill(0)];
    const summary = summarizeCategory(category, actuals);
    expect(summary.totalPlanned).toBe(300);
    expect(summary.totalActual).toBe(200);
    expect(summary.totalRemaining).toBe(100);
    expect(summary.available.slice(0, 3)).toEqual([10, 0, 100]);
  });

  it("requires twelve-month arrays", () => {
    expect(() => summarizeCategory(category, [0, 0])).toThrow(RangeError);
    expect(() =>
      summarizeCategory({ ...category, plans: [1] }, Array(12).fill(0))
    ).toThrow(RangeError);
  });
});

describe("aggregateSummaries", () => {
  it("sums monthly columns across categories", () => {
    const a = summarizeCategory(
      {
        id: "a",
        kind: "expense",
        rolloverEnabled: true,
        plans: PLANS,
      },
      [60, ...Array(11).fill(0)]
    );
    const b = summarizeCategory(
      {
        id: "b",
        kind: "savings",
        rolloverEnabled: false,
        plans: PLANS.map((value) => value + 50),
      },
      [70, ...Array(11).fill(0)]
    );
    const aggregate = aggregateSummaries([a, b]);
    expect(aggregate.planned[0]).toBe(250);
    expect(aggregate.actual[0]).toBe(130);
    expect(aggregate.available[0]).toBe(120);
    // Aggregate availability ignores per-category rollover (documented choice).
    expect(aggregate.available[1]).toBe(250);
  });

  it("handles the empty list", () => {
    const aggregate = aggregateSummaries([]);
    expect(aggregate.planned.every((value) => value === 0)).toBe(true);
  });
});

describe("buildHealthCells", () => {
  it("only judges months with recorded activity", () => {
    const summary = summarizeCategory(
      {
        id: "cat",
        kind: "expense",
        rolloverEnabled: false,
        plans: PLANS,
      },
      [80, 120, ...Array(10).fill(0)]
    );
    const cells = buildHealthCells([summary]);
    expect(cells).toEqual([
      { planned: 100, actual: 80 },
      { planned: 100, actual: 120 },
    ]);
  });
});

describe("computeBudgetHealth", () => {
  it("returns null score when nothing was recorded", () => {
    const health = computeBudgetHealth([]);
    expect(health.score).toBeNull();
    expect(health.cellsEvaluated).toBe(0);
  });

  it("scores perfect adherence at 100/great", () => {
    const health = computeBudgetHealth([
      { planned: 100, actual: 100 },
      { planned: 200, actual: 150 },
      { planned: 50, actual: 50 },
    ]);
    expect(health.score).toBe(100);
    expect(health.grade).toBe("great");
    expect(health.cellsOverspent).toBe(0);
  });

  it("penalizes overspending proportionally and caps at plan saturation", () => {
    const health = computeBudgetHealth([
      { planned: 100, actual: 200 }, // penalty 1
      { planned: 100, actual: 100 }, // penalty 0
    ]);
    expect(health.score).toBe(50);
    expect(health.grade).toBe("poor");
    expect(health.cellsOverspent).toBe(1);
  });

  it("lands fair for a mixed but mostly-on-plan record", () => {
    const health = computeBudgetHealth([
      { planned: 100, actual: 200 },
      { planned: 100, actual: 100 },
      { planned: 100, actual: 100 },
    ]);
    expect(health.score).toBe(67);
    expect(health.grade).toBe("fair");
  });

  it("treats unplanned spending as full penalty", () => {
    const health = computeBudgetHealth([{ planned: 0, actual: 25 }]);
    expect(health.score).toBe(0);
    expect(health.grade).toBe("poor");
  });

  it("tolerates float dust around plan", () => {
    const health = computeBudgetHealth([
      { planned: 100, actual: 100 + 1e-12 },
    ]);
    expect(health.cellsOverspent).toBe(0);
    expect(health.score).toBe(100);
  });

  it("maps scores to grades via thresholds", () => {
    expect(gradeForScore(95)).toBe("great");
    expect(gradeForScore(90)).toBe("great");
    expect(gradeForScore(89.4)).toBe("good");
    expect(gradeForScore(75)).toBe("good");
    expect(gradeForScore(60)).toBe("fair");
    expect(gradeForScore(59)).toBe("poor");
  });
});

describe("isCategoryKind", () => {
  it("accepts only known kinds", () => {
    expect(isCategoryKind("expense")).toBe(true);
    expect(isCategoryKind("savings")).toBe(true);
    expect(isCategoryKind("income")).toBe(false);
    expect(isCategoryKind(42)).toBe(false);
  });
});
