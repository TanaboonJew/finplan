import { beforeEach, describe, expect, it } from "vitest";
import {
  DCA_SCHEMA_VERSION,
  currentMonth,
  createDefaultFund,
  sanitizeDcaToolPersisted,
  useDcaStore,
  type DcaToolPersisted,
} from "@/lib/storage/dca-store";

const snapshot: DcaToolPersisted = {
  funds: [
    {
      id: "f1",
      name: "Index fund",
      expenseRatio: 0.0003,
      frontLoad: 0,
      exitLoad: 0,
      annualReturn: 0.08,
    },
    {
      id: "f2",
      name: "Active fund",
      expenseRatio: 0.015,
      frontLoad: 0.05,
      exitLoad: 0.01,
      annualReturn: 0.095,
    },
  ],
  monthlyContribution: 500,
  horizonMonths: 360,
  currency: "USD",
};

describe("dca store", () => {
  beforeEach(() => {
    localStorage.clear();
    useDcaStore.getState().reset();
  });

  it("starts empty with defaults", () => {
    const state = useDcaStore.getState();
    expect(state.funds).toEqual([]);
    expect(state.monthlyContribution).toBe(0);
    expect(state.horizonMonths).toBe(360);
    expect(state.currency).toBe("USD");
  });

  it("adds funds", () => {
    const fund = createDefaultFund();
    useDcaStore.getState().addFund(fund);
    expect(useDcaStore.getState().funds).toHaveLength(1);
    expect(useDcaStore.getState().funds[0].id).toBe(fund.id);
  });

  it("updates fund by id", () => {
    useDcaStore.getState().addFund(createDefaultFund());
    const id = useDcaStore.getState().funds[0].id;
    useDcaStore.getState().updateFund(id, { name: "Test", annualReturn: 0.1 });
    expect(useDcaStore.getState().funds[0].name).toBe("Test");
    expect(useDcaStore.getState().funds[0].annualReturn).toBe(0.1);
  });

  it("removes fund by id", () => {
    useDcaStore.getState().addFund(createDefaultFund());
    useDcaStore.getState().addFund(createDefaultFund());
    const id = useDcaStore.getState().funds[0].id;
    useDcaStore.getState().removeFund(id);
    expect(useDcaStore.getState().funds).toHaveLength(1);
  });

  it("clamps monthlyContribution to non-negative", () => {
    useDcaStore.getState().setMonthlyContribution(-100);
    expect(useDcaStore.getState().monthlyContribution).toBe(0);
  });

  it("clamps horizonMonths to 1–600", () => {
    useDcaStore.getState().setHorizonMonths(0);
    expect(useDcaStore.getState().horizonMonths).toBe(1);
    useDcaStore.getState().setHorizonMonths(999);
    expect(useDcaStore.getState().horizonMonths).toBe(600);
  });

  it("replaceState overwrites the whole slice", () => {
    useDcaStore.getState().replaceState(snapshot);
    const state = useDcaStore.getState();
    expect(state.funds).toHaveLength(2);
    expect(state.monthlyContribution).toBe(500);
    expect(state.currency).toBe("USD");
  });

  it("persists to localStorage under the versioned key", () => {
    useDcaStore.getState().replaceState(snapshot);
    const raw = localStorage.getItem("finplan:dca:v1");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as {
      state: { monthlyContribution: number };
      version: number;
    };
    expect(parsed.state.monthlyContribution).toBe(500);
    expect(parsed.version).toBe(1);
  });

  it("creates default fund with valid id", () => {
    const fund = createDefaultFund();
    expect(fund.id).toBeTruthy();
    expect(fund.id.length).toBeGreaterThan(0);
  });
});

describe("sanitizeDcaToolPersisted", () => {
  it("accepts a valid snapshot and normalizes currency case", () => {
    const result = sanitizeDcaToolPersisted(snapshot);
    expect(result?.currency).toBe("USD");
    expect(result?.funds).toHaveLength(2);
  });

  it("rejects non-objects and missing funds array", () => {
    expect(sanitizeDcaToolPersisted(null)).toBeNull();
    expect(sanitizeDcaToolPersisted("nope")).toBeNull();
    expect(sanitizeDcaToolPersisted({})).toBeNull();
  });

  it("drops fund entries without names and clamps bad numbers", () => {
    const result = sanitizeDcaToolPersisted({
      funds: [
        { name: "", expenseRatio: 0.01 },
        { name: "Ok", expenseRatio: -1, annualReturn: "x" },
        "junk",
      ],
      monthlyContribution: -100,
      horizonMonths: 999,
      currency: "NOPE!",
    });
    expect(result?.funds).toHaveLength(1);
    expect(result?.funds[0]).toMatchObject({
      name: "Ok",
      expenseRatio: 0,
      annualReturn: 0,
    });
    expect(result?.monthlyContribution).toBe(1);
    expect(result?.horizonMonths).toBe(600);
    expect(result?.currency).toBe("USD");
  });

  it("matches the exported schema version constant", () => {
    expect(DCA_SCHEMA_VERSION).toBe(1);
  });
});

describe("currentMonth", () => {
  it("formats a UTC year-month", () => {
    expect(currentMonth(new Date(Date.UTC(2026, 7, 24)))).toBe("2026-08");
    expect(currentMonth(new Date(Date.UTC(2026, 11, 1)))).toBe("2026-12");
  });
});
