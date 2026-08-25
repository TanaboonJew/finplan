import { beforeEach, describe, expect, it } from "vitest";
import {
  FLOW_SCHEMA_VERSION,
  currentMonth,
  sanitizeFlowSnapshot,
  useFlowStore,
  type FlowSnapshot,
} from "@/lib/storage/flow-store";

const snapshot: FlowSnapshot = {
  streams: [
    {
      id: "s1",
      name: "Salary",
      amount: 4000,
      category: "income",
      startMonth: "2026-01",
      endMonth: null,
    },
    {
      id: "s2",
      name: "Rent",
      amount: 1200,
      category: "expense",
      startMonth: "2026-01",
      endMonth: "2026-12",
    },
  ],
  startingBalance: 5000,
  horizonMonths: 12,
  currency: "USD",
};

describe("flow store", () => {
  beforeEach(() => {
    localStorage.clear();
    useFlowStore.getState().reset();
  });

  it("starts empty with defaults", () => {
    const state = useFlowStore.getState();
    expect(state.streams).toEqual([]);
    expect(state.startingBalance).toBe(0);
    expect(state.horizonMonths).toBe(12);
    expect(state.currency).toBe("USD");
    expect(state.whatIfAdjustments).toEqual([]);
  });

  it("adds streams and generates ids when omitted", () => {
    const id = useFlowStore.getState().addStream({
      name: "Salary",
      amount: 3000,
      category: "income",
      startMonth: "2026-01",
      endMonth: null,
    });
    expect(id).toBeTruthy();
    const [stream] = useFlowStore.getState().streams;
    expect(stream?.id).toBe(id);
    expect(stream?.name).toBe("Salary");
  });

  it("updates and removes streams by id", () => {
    const id = useFlowStore
      .getState()
      .addStream({
        name: "A",
        amount: 100,
        category: "income",
        startMonth: "2026-01",
        endMonth: null,
      });
    useFlowStore.getState().updateStream(id, { amount: 999 });
    expect(useFlowStore.getState().streams[0]?.amount).toBe(999);
    useFlowStore.getState().removeStream(id);
    expect(useFlowStore.getState().streams).toEqual([]);
  });

  it("sets starting balance, horizon, and currency", () => {
    useFlowStore.getState().setStartingBalance(10000);
    expect(useFlowStore.getState().startingBalance).toBe(10000);
    useFlowStore.getState().setHorizonMonths(24);
    expect(useFlowStore.getState().horizonMonths).toBe(24);
    useFlowStore.getState().setCurrency("THB");
    expect(useFlowStore.getState().currency).toBe("THB");
  });

  it("clamps negative starting balance to zero", () => {
    useFlowStore.getState().setStartingBalance(-500);
    expect(useFlowStore.getState().startingBalance).toBe(0);
  });

  it("clamps horizon months to 1-120 range", () => {
    useFlowStore.getState().setHorizonMonths(-5);
    expect(useFlowStore.getState().horizonMonths).toBe(12);
    useFlowStore.getState().setHorizonMonths(999);
    expect(useFlowStore.getState().horizonMonths).toBe(120);
  });

  it("manages what-if adjustments", () => {
    const id = useFlowStore
      .getState()
      .addStream({
        name: "X",
        amount: 100,
        category: "income",
        startMonth: "2026-01",
        endMonth: null,
      });
    useFlowStore.getState().setWhatIfAdjustments([{ streamId: id, scale: 1.2 }]);
    expect(useFlowStore.getState().whatIfAdjustments).toHaveLength(1);
    useFlowStore.getState().resetWhatIf();
    expect(useFlowStore.getState().whatIfAdjustments).toEqual([]);
  });

  it("replaceState overwrites the whole slice and clears what-if", () => {
    const id = useFlowStore
      .getState()
      .addStream({
        name: "Old",
        amount: 100,
        category: "income",
        startMonth: "2026-01",
        endMonth: null,
      });
    useFlowStore.getState().setWhatIfAdjustments([{ streamId: id, scale: 2 }]);
    useFlowStore.getState().replaceState(snapshot);
    const state = useFlowStore.getState();
    expect(state.streams).toHaveLength(2);
    expect(state.currency).toBe("USD");
    expect(state.whatIfAdjustments).toEqual([]);
  });

  it("persists to localStorage under the versioned key", () => {
    useFlowStore.getState().replaceState(snapshot);
    const raw = localStorage.getItem("finplan:flow:v1");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as {
      state: { streams: unknown[] };
      version: number;
    };
    expect(parsed.state.streams).toHaveLength(2);
    expect(parsed.version).toBe(1);
  });
});

describe("sanitizeFlowSnapshot", () => {
  it("accepts a valid snapshot and normalizes currency", () => {
    const result = sanitizeFlowSnapshot({
      ...snapshot,
      currency: "thb",
    });
    expect(result?.currency).toBe("THB");
    expect(result?.streams).toHaveLength(2);
  });

  it("rejects non-objects and missing streams arrays", () => {
    expect(sanitizeFlowSnapshot(null)).toBeNull();
    expect(sanitizeFlowSnapshot("bad")).toBeNull();
    expect(sanitizeFlowSnapshot({})).toBeNull();
  });

  it("drops invalid streams and clamps bad values", () => {
    const result = sanitizeFlowSnapshot({
      streams: [
        { name: "", amount: 100, category: "income", startMonth: "2026-01" },
        { name: "Ok", amount: -50, category: "income", startMonth: "2026-01" },
        "junk",
      ],
      startingBalance: -100,
      horizonMonths: 999,
      currency: "NOPE!",
    });
    expect(result?.streams).toHaveLength(1);
    expect(result?.startingBalance).toBe(0);
    expect(result?.horizonMonths).toBe(120);
    expect(result?.currency).toBe("USD");
  });

  it("matches the exported schema version constant", () => {
    expect(FLOW_SCHEMA_VERSION).toBe(1);
  });
});

describe("currentMonth", () => {
  it("formats a UTC year-month", () => {
    expect(currentMonth(new Date(Date.UTC(2026, 7, 24)))).toBe("2026-08");
    expect(currentMonth(new Date(Date.UTC(2026, 11, 1)))).toBe("2026-12");
  });
});
