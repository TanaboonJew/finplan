import { describe, expect, it } from "vitest";
import {
  compareStrategies,
  simulatePayoff,
  type Debt,
} from "@/lib/finance/payoff";

const mixedDebts: Debt[] = [
  { id: "card", balance: 5000, annualRate: 0.18, minimumPayment: 150 },
  { id: "loan", balance: 10000, annualRate: 0.07, minimumPayment: 200 },
  { id: "store", balance: 1000, annualRate: 0.24, minimumPayment: 50 },
];

describe("payoff", () => {
const splitDebts: Debt[] = [
  { id: "small-low", balance: 1000, annualRate: 0.08, minimumPayment: 40 },
  { id: "big-high", balance: 5000, annualRate: 0.2, minimumPayment: 150 },
];

it.each([
  ["snowball", ["small-low", "big-high"]],
  ["avalanche", ["big-high", "small-low"]],
] as const)("pays %s order when strategies disagree", (strategy, expected) => {
  const result = simulatePayoff(splitDebts, {
    strategy,
    extraMonthlyPayment: 300,
  });
  expect(result.payoffOrder).toEqual(expected);
});

  it("avalanche never costs more interest than snowball", () => {
    const snowball = simulatePayoff(mixedDebts, { strategy: "snowball" });
    const avalanche = simulatePayoff(mixedDebts, { strategy: "avalanche" });
    expect(avalanche.totalInterest).toBeLessThanOrEqual(snowball.totalInterest);
  });

  it("hybrid targets high-interest debt first then snowballs the rest", () => {
    const debts: Debt[] = [
      { id: "mid", balance: 3000, annualRate: 0.19, minimumPayment: 100 },
      { id: "big-low", balance: 4000, annualRate: 0.08, minimumPayment: 120 },
      { id: "tiny-low", balance: 500, annualRate: 0.03, minimumPayment: 25 },
    ];
    const result = simulatePayoff(debts, {
      strategy: "hybrid",
      extraMonthlyPayment: 200,
    });
    expect(result.payoffOrder[0]).toBe("mid");

    const strictHybrid = simulatePayoff(debts, {
      strategy: "hybrid",
      extraMonthlyPayment: 200,
      highInterestAprThreshold: 0.15,
    });
    expect(strictHybrid.payoffOrder).toEqual(["mid", "tiny-low", "big-low"]);
  });

  it("extra payments finish sooner and cost less interest", () => {
    const base = simulatePayoff(mixedDebts, { strategy: "avalanche" });
    const boosted = simulatePayoff(mixedDebts, {
      strategy: "avalanche",
      extraMonthlyPayment: 300,
    });
    expect(boosted.monthsToPayoff).toBeLessThan(base.monthsToPayoff);
    expect(boosted.totalInterest).toBeLessThan(base.totalInterest);
  });

  it("conserves money: paid principal equals balances plus interest", () => {
    const result = simulatePayoff(mixedDebts, { strategy: "hybrid" });
    const startingTotal = mixedDebts.reduce((sum, d) => sum + d.balance, 0);
    expect(result.totalPaid - result.totalInterest).toBeCloseTo(
      startingTotal,
      0
    );
    expect(result.monthly[result.monthly.length - 1].totalBalance).toBe(0);
  });

  it("records payoff months per debt, including same-month payoffs", () => {
    const result = simulatePayoff(mixedDebts, {
      strategy: "snowball",
      extraMonthlyPayment: 5000,
    });
    for (const id of ["card", "loan", "store"]) {
      expect(result.payoffMonthById[id]).toBeGreaterThan(0);
    }
    expect(result.payoffMonthById["store"]).toBeLessThanOrEqual(
      result.payoffMonthById["card"]
    );
    expect(result.payoffMonthById["card"]).toBeLessThanOrEqual(
      result.payoffMonthById["loan"]
    );

    const simultaneous = simulatePayoff(
      [
        { id: "a", balance: 100, annualRate: 0.1, minimumPayment: 10 },
        { id: "b", balance: 150, annualRate: 0.12, minimumPayment: 10 },
      ],
      { strategy: "avalanche", extraMonthlyPayment: 500 }
    );
    expect(simultaneous.monthsToPayoff).toBe(1);
    expect(new Set(Object.values(simultaneous.payoffMonthById)).size).toBe(1);
  });

  it("ignores already-paid debts and handles an empty list", () => {
    const withPaidOff: Debt[] = [
      ...mixedDebts,
      { id: "cleared", balance: 0, annualRate: 0.2, minimumPayment: 0 },
    ];
    const result = simulatePayoff(withPaidOff, { strategy: "snowball" });
    expect(result.payoffOrder).not.toContain("cleared");
    expect(simulatePayoff([], { strategy: "snowball" }).monthsToPayoff).toBe(0);
  });

  it("throws when payments cannot reduce the balances", () => {
    const stuck: Debt[] = [
      { id: "forever", balance: 1000, annualRate: 0.12, minimumPayment: 0 },
    ];
    expect(() =>
      simulatePayoff(stuck, { strategy: "snowball" })
    ).toThrow(/cannot be repaid/);
  });

  it("gives up after maxMonths instead of looping forever", () => {
    expect(() =>
      simulatePayoff(mixedDebts, { strategy: "snowball", maxMonths: 3 })
    ).toThrow(/did not finish within 3 months/);
  });

  it("compares every strategy at once", () => {
    const results = compareStrategies(mixedDebts, { extraMonthlyPayment: 100 });
    expect(Object.keys(results).sort()).toEqual([
      "avalanche",
      "hybrid",
      "snowball",
    ]);
    expect(results.avalanche.totalInterest).toBeLessThanOrEqual(
      results.snowball.totalInterest
    );
  });

  it("rejects malformed debt lists", () => {
    expect(() =>
      simulatePayoff([{ ...mixedDebts[0], balance: -5 }], {
        strategy: "snowball",
      })
    ).toThrow(RangeError);
    expect(() =>
      simulatePayoff([mixedDebts[0], mixedDebts[0]], { strategy: "snowball" })
    ).toThrow(/duplicate debt id/);
  });
});
