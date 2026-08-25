import { beforeEach, describe, expect, it } from "vitest";
import {
  PAY_SCHEMA_VERSION,
  sanitizePaySnapshot,
  usePayStore,
  type PaySnapshot,
} from "@/lib/storage/pay-store";

const snapshot: PaySnapshot = {
  subscriptions: [
    {
      id: "sub1",
      name: "Netflix",
      amount: 15.49,
      cycle: "monthly",
      category: "streaming",
      startDate: "2022-01",
      renewalDay: 8,
      currency: "USD",
      priceHistory: [
        { amount: 13.99, effectiveMonth: "2022-01" },
        { amount: 15.49, effectiveMonth: "2024-01" },
      ],
      active: true,
    },
  ],
  currency: "USD",
};

describe("pay store", () => {
  beforeEach(() => {
    localStorage.clear();
    usePayStore.getState().reset();
  });

  it("starts empty with defaults", () => {
    const state = usePayStore.getState();
    expect(state.subscriptions).toEqual([]);
    expect(state.currency).toBe("USD");
  });

  it("adds subscriptions and generates ids when omitted", () => {
    const id = usePayStore.getState().addSubscription({
      name: "Spotify",
      amount: 10.99,
      cycle: "monthly",
      category: "music",
      startDate: "2023-01",
      renewalDay: 14,
      currency: "USD",
      active: true,
    });
    expect(id).toBeTruthy();
    const [sub] = usePayStore.getState().subscriptions;
    expect(sub.id).toBe(id);
    expect(sub.name).toBe("Spotify");
    expect(sub.priceHistory).toHaveLength(1);
    expect(sub.priceHistory[0]?.amount).toBe(10.99);
  });

  it("updates and removes subscriptions by id", () => {
    const id = usePayStore.getState().addSubscription({
      name: "Test",
      amount: 5,
      cycle: "monthly",
      category: "other",
      startDate: "2025-01",
      renewalDay: 1,
      currency: "USD",
      active: true,
    });
    usePayStore.getState().updateSubscription(id, { amount: 9.99 });
    expect(usePayStore.getState().subscriptions[0].amount).toBe(9.99);
    usePayStore.getState().removeSubscription(id);
    expect(usePayStore.getState().subscriptions).toEqual([]);
  });

  it("records price increases", () => {
    const id = usePayStore.getState().addSubscription({
      name: "Test",
      amount: 10,
      cycle: "monthly",
      category: "other",
      startDate: "2025-01",
      renewalDay: 1,
      currency: "USD",
      active: true,
    });
    usePayStore.getState().recordPriceIncrease(id, 12, "2025-06");
    const sub = usePayStore.getState().subscriptions[0];
    expect(sub.amount).toBe(12);
    expect(sub.priceHistory).toHaveLength(2);
    expect(sub.priceHistory[1]).toEqual({ amount: 12, effectiveMonth: "2025-06" });
  });

  it("clamps negative amounts in recordPriceIncrease", () => {
    const id = usePayStore.getState().addSubscription({
      name: "Test",
      amount: 10,
      cycle: "monthly",
      category: "other",
      startDate: "2025-01",
      renewalDay: 1,
      currency: "USD",
      active: true,
    });
    usePayStore.getState().recordPriceIncrease(id, -5, "2025-06");
    expect(usePayStore.getState().subscriptions[0].amount).toBe(10);
  });

  it("replaceState overwrites the whole slice", () => {
    usePayStore.getState().replaceState(snapshot);
    const state = usePayStore.getState();
    expect(state.subscriptions).toHaveLength(1);
    expect(state.currency).toBe("USD");
  });

  it("persists to localStorage under the versioned key", () => {
    usePayStore.getState().replaceState(snapshot);
    const raw = localStorage.getItem("finplan:pay:v1");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as {
      state: { currency: string };
      version: number;
    };
    expect(parsed.state.currency).toBe("USD");
    expect(parsed.version).toBe(1);
  });
});

describe("sanitizePaySnapshot", () => {
  it("accepts a valid snapshot and normalizes currency case", () => {
    const result = sanitizePaySnapshot(snapshot);
    expect(result?.currency).toBe("USD");
    expect(result?.subscriptions[0]?.name).toBe("Netflix");
  });

  it("rejects non-objects and missing subscription arrays", () => {
    expect(sanitizePaySnapshot(null)).toBeNull();
    expect(sanitizePaySnapshot("nope")).toBeNull();
    expect(sanitizePaySnapshot({})).toBeNull();
  });

  it("drops invalid subscription entries", () => {
    const result = sanitizePaySnapshot({
      subscriptions: [
        { name: "", amount: 10, cycle: "monthly", startDate: "2025-01", renewalDay: 1, currency: "USD", priceHistory: [], active: true },
        { name: "Valid", amount: 5, cycle: "monthly", startDate: "2025-01", renewalDay: 1, currency: "USD", priceHistory: [{ amount: 5, effectiveMonth: "2025-01" }], active: true },
        "junk",
      ],
      currency: "NOPE!",
    });
    expect(result?.subscriptions).toHaveLength(1);
    expect(result?.subscriptions[0]?.name).toBe("Valid");
    expect(result?.currency).toBe("USD");
  });

  it("falls back to default price history when empty", () => {
    const result = sanitizePaySnapshot({
      subscriptions: [
        { name: "Test", amount: 10, cycle: "monthly", startDate: "2025-01", renewalDay: 1, currency: "USD", priceHistory: [], active: true },
      ],
      currency: "USD",
    });
    expect(result?.subscriptions[0]?.priceHistory).toHaveLength(1);
    expect(result?.subscriptions[0]?.priceHistory[0]?.amount).toBe(10);
  });

  it("matches the exported schema version constant", () => {
    expect(PAY_SCHEMA_VERSION).toBe(1);
  });
});
