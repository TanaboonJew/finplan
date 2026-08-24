import { beforeEach, describe, expect, it } from "vitest";
import { PAYOFF_STRATEGIES } from "@/lib/finance/payoff";
import {
  DEBT_SCHEMA_VERSION,
  currentMonth,
  sanitizeDebtSnapshot,
  useDebtStore,
  type DebtSnapshot,
} from "@/lib/storage/debt-store";

const snapshot: DebtSnapshot = {
  debts: [
    {
      id: "d1",
      name: "Card",
      balance: 1000,
      annualRate: 0.2,
      minimumPayment: 50,
    },
  ],
  strategy: "avalanche",
  extraMonthlyPayment: 25,
  currency: "thb",
  startMonth: "2026-01",
};

describe("debt store", () => {
  beforeEach(() => {
    localStorage.clear();
    useDebtStore.getState().reset();
  });

  it("starts empty with defaults", () => {
    const state = useDebtStore.getState();
    expect(state.debts).toEqual([]);
    expect(state.strategy).toBe("snowball");
    expect(state.extraMonthlyPayment).toBe(0);
    expect(state.currency).toBe("USD");
    expect(state.startMonth).toBeNull();
  });

  it("adds debts and generates ids when omitted", () => {
    const id = useDebtStore.getState().addDebt({
      name: "Loan",
      balance: 500,
      annualRate: 0.1,
      minimumPayment: 30,
    });
    expect(id).toBeTruthy();
    const [debt] = useDebtStore.getState().debts;
    expect(debt.id).toBe(id);
    expect(debt.name).toBe("Loan");
  });

  it("updates and removes debts by id", () => {
    const id = useDebtStore
      .getState()
      .addDebt({ name: "A", balance: 1, annualRate: 0, minimumPayment: 0 });
    useDebtStore.getState().updateDebt(id, { balance: 99 });
    expect(useDebtStore.getState().debts[0].balance).toBe(99);
    useDebtStore.getState().removeDebt(id);
    expect(useDebtStore.getState().debts).toEqual([]);
  });

  it("clamps negative extra payments to zero", () => {
    useDebtStore.getState().setExtraMonthlyPayment(-10);
    expect(useDebtStore.getState().extraMonthlyPayment).toBe(0);
  });

  it("replaceState overwrites the whole slice", () => {
    useDebtStore.getState().replaceState(snapshot);
    const state = useDebtStore.getState();
    expect(state.debts).toHaveLength(1);
    expect(state.strategy).toBe("avalanche");
    expect(state.currency).toBe("THB");
  });

  it("persists to localStorage under the versioned key", () => {
    useDebtStore.getState().replaceState(snapshot);
    const raw = localStorage.getItem("finplan:debt:v1");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as {
      state: { strategy: string };
      version: number;
    };
    expect(parsed.state.strategy).toBe("avalanche");
    expect(parsed.version).toBe(1);
  });
});

describe("sanitizeDebtSnapshot", () => {
  it("accepts a valid snapshot and normalizes currency case", () => {
    const result = sanitizeDebtSnapshot(snapshot);
    expect(result?.currency).toBe("THB");
    expect(result?.debts[0]?.name).toBe("Card");
  });

  it("rejects non-objects and missing debt arrays", () => {
    expect(sanitizeDebtSnapshot(null)).toBeNull();
    expect(sanitizeDebtSnapshot("nope")).toBeNull();
    expect(sanitizeDebtSnapshot({})).toBeNull();
  });

  it("drops debt entries without names and clamps bad numbers", () => {
    const result = sanitizeDebtSnapshot({
      debts: [
        { name: "", balance: 10 },
        { name: "Ok", balance: -5, annualRate: -1, minimumPayment: "x" },
        "junk",
      ],
      strategy: "bogus",
      extraMonthlyPayment: -3,
      currency: "NOPE!",
      startMonth: "13/2026",
    });
    expect(result?.debts).toHaveLength(1);
    expect(result?.debts[0]).toMatchObject({
      name: "Ok",
      balance: 0,
      annualRate: 0,
      minimumPayment: 0,
    });
    expect(result?.strategy).toBe("snowball");
    expect(result?.extraMonthlyPayment).toBe(0);
    expect(result?.currency).toBe("USD");
    expect(result?.startMonth).toBeNull();
  });

  it("keeps only known payoff strategies", () => {
    for (const strategy of PAYOFF_STRATEGIES) {
      const result = sanitizeDebtSnapshot({ debts: [], strategy });
      expect(result?.strategy).toBe(strategy);
    }
  });

  it("matches the exported schema version constant", () => {
    expect(DEBT_SCHEMA_VERSION).toBe(1);
  });
});

describe("currentMonth", () => {
  it("formats a UTC year-month", () => {
    expect(currentMonth(new Date(Date.UTC(2026, 7, 24)))).toBe("2026-08");
    expect(currentMonth(new Date(Date.UTC(2026, 11, 1)))).toBe("2026-12");
  });
});
