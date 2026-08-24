import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_RETIREMENT_STATE,
  RETIREMENT_SCHEMA_VERSION,
  sanitizeRetirementSnapshot,
  useRetirementStore,
  type RetirementSnapshot,
} from "@/lib/storage/retirement-store";

const snapshot: RetirementSnapshot = {
  currentAge: 41,
  retirementAge: 67,
  currentSavings: 123000,
  monthlyContribution: 1500,
  annualReturnRate: 0.065,
  inflationRate: 0.025,
  desiredRetirementIncome: 60000,
  withdrawalRate: 0.035,
  currency: "thb",
};

describe("retirement store", () => {
  beforeEach(() => {
    localStorage.clear();
    useRetirementStore.getState().reset();
  });

  it("starts with sensible defaults", () => {
    const state = useRetirementStore.getState();
    expect(state.currentAge).toBe(DEFAULT_RETIREMENT_STATE.currentAge);
    expect(state.retirementAge).toBeGreaterThan(state.currentAge);
    expect(state.withdrawalRate).toBe(0.04);
    expect(state.currency).toBe("USD");
  });

  it("sets every field through its action", () => {
    const s = useRetirementStore.getState();
    s.setCurrentAge(40);
    s.setRetirementAge(60);
    s.setCurrentSavings(90000);
    s.setMonthlyContribution(1200);
    s.setAnnualReturnRate(0.08);
    s.setInflationRate(0.02);
    s.setDesiredRetirementIncome(55000);
    s.setWithdrawalRate(0.05);
    s.setCurrency("eur");
    const state = useRetirementStore.getState();
    expect(state).toMatchObject({
      currentAge: 40,
      retirementAge: 60,
      currentSavings: 90000,
      monthlyContribution: 1200,
      annualReturnRate: 0.08,
      inflationRate: 0.02,
      desiredRetirementIncome: 55000,
      withdrawalRate: 0.05,
      currency: "EUR",
    });
  });

  it("clamps out-of-range values into safe bounds", () => {
    const s = useRetirementStore.getState();
    s.setCurrentAge(-5);
    s.setRetirementAge(999);
    s.setCurrentSavings(-100);
    s.setMonthlyContribution(null);
    s.setAnnualReturnRate(5);
    s.setInflationRate(-1);
    s.setWithdrawalRate(0.0001);
    const state = useRetirementStore.getState();
    expect(state.currentAge).toBe(0);
    expect(state.retirementAge).toBe(120);
    expect(state.currentSavings).toBe(0);
    expect(state.monthlyContribution).toBe(0);
    expect(state.annualReturnRate).toBe(0.5);
    expect(state.inflationRate).toBe(0);
    expect(state.withdrawalRate).toBe(0.005);
  });

  it("replaceState overwrites the whole slice and normalizes currency", () => {
    useRetirementStore.getState().replaceState(snapshot);
    const state = useRetirementStore.getState();
    expect(state.currentSavings).toBe(123000);
    expect(state.currency).toBe("THB");
  });

  it("reset returns to defaults after changes", () => {
    useRetirementStore.getState().replaceState(snapshot);
    useRetirementStore.getState().reset();
    expect(useRetirementStore.getState().currentSavings).toBe(
      DEFAULT_RETIREMENT_STATE.currentSavings
    );
  });

  it("persists to localStorage under the versioned key", () => {
    useRetirementStore.getState().replaceState(snapshot);
    const raw = localStorage.getItem("finplan:retirement:v1");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as {
      state: { withdrawalRate: number };
      version: number;
    };
    expect(parsed.state.withdrawalRate).toBe(0.035);
    expect(parsed.version).toBe(1);
  });
});

describe("sanitizeRetirementSnapshot", () => {
  it("accepts a valid snapshot and normalizes currency case", () => {
    const result = sanitizeRetirementSnapshot(snapshot);
    expect(result?.currency).toBe("THB");
    expect(result?.monthlyContribution).toBe(1500);
  });

  it("rejects non-objects", () => {
    expect(sanitizeRetirementSnapshot(null)).toBeNull();
    expect(sanitizeRetirementSnapshot("nope")).toBeNull();
    expect(sanitizeRetirementSnapshot([])).toBeNull();
  });

  it("coerces junk fields into the safe default shape", () => {
    const result = sanitizeRetirementSnapshot({
      currentAge: "forty",
      retirementAge: 12.7,
      currentSavings: -3,
      monthlyContribution: NaN,
      annualReturnRate: "x",
      inflationRate: 9,
      desiredRetirementIncome: null,
      withdrawalRate: 42,
      currency: "NOPE!",
    });
    expect(result).toEqual({
      currentAge: 0,
      retirementAge: 13,
      currentSavings: 0,
      monthlyContribution: 0,
      annualReturnRate: 0,
      inflationRate: 0.5,
      desiredRetirementIncome: 0,
      withdrawalRate: 0.2,
      currency: "USD",
    });
  });

  it("matches the exported schema version constant", () => {
    expect(RETIREMENT_SCHEMA_VERSION).toBe(1);
  });
});
