import { beforeEach, describe, expect, it } from "vitest";
import { createJarDemoState } from "@/lib/demo/jar";
import {
  computeJarActivity,
  summarizeJars,
} from "@/lib/finance/jars";
import {
  EMPTY_JAR_STATE,
  JAR_EXPORT_SCHEMA_VERSION,
  parseJarToolState,
  useJarStore,
} from "@/lib/storage/jar-store";

const STORAGE_KEY = "finplan:jar:v1";

function freshState() {
  useJarStore.setState({ ...EMPTY_JAR_STATE });
}

beforeEach(() => {
  localStorage.clear();
  freshState();
});

describe("jar store actions", () => {
  it("starts empty", () => {
    expect(useJarStore.getState().jars).toEqual([]);
    expect(useJarStore.getState().incomes).toEqual([]);
  });

  it("adds jars with a zero percent and updates them", () => {
    useJarStore.getState().addJar("Sinking fund");
    const [jar] = useJarStore.getState().jars;
    expect(jar.name).toBe("Sinking fund");
    expect(jar.allocationPercent).toBe(0);

    useJarStore
      .getState()
      .updateJar(jar.id, { allocationPercent: 0.15, name: "Car fund" });
    expect(useJarStore.getState().jars[0]).toMatchObject({
      name: "Car fund",
      allocationPercent: 0.15,
    });
  });

  it("snapshots allocations when recording income and persists to localStorage", () => {
    useJarStore.getState().addJar("Necessities");
    useJarStore.getState().addJar("Play");
    const [nec, play] = useJarStore.getState().jars;
    useJarStore.getState().updateJar(nec.id, { allocationPercent: 0.75 });
    useJarStore.getState().updateJar(play.id, { allocationPercent: 0.25 });

    useJarStore
      .getState()
      .addIncome({ amount: 100.01, date: "2026-08-24", note: " freelance " });

    const { incomes } = useJarStore.getState();
    expect(incomes).toHaveLength(1);
    expect(incomes[0].allocations).toEqual([
      { jarId: nec.id, amount: 75.01 },
      { jarId: play.id, amount: 25 },
    ]);
    expect(incomes[0].note).toBe("freelance");

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.state.incomes).toHaveLength(1);
    expect(persisted.version).toBe(1);
  });

  it("ignores income when there is nothing to allocate to", () => {
    useJarStore
      .getState()
      .addIncome({ amount: 500, date: "2026-08-24", note: "" });
    expect(useJarStore.getState().incomes).toHaveLength(0);

    useJarStore.getState().addJar("Zero percent");
    useJarStore.getState().updateJar(useJarStore.getState().jars[0].id, {
      allocationPercent: 0,
    });
    useJarStore
      .getState()
      .addIncome({ amount: 500, date: "2026-08-24", note: "" });
    expect(useJarStore.getState().incomes).toHaveLength(0);

    useJarStore
      .getState()
      .addIncome({ amount: -5, date: "2026-08-24", note: "" });
    expect(useJarStore.getState().incomes).toHaveLength(0);
  });

  it("blocks expenses that exceed the jar balance", () => {
    useJarStore.getState().addJar("Play");
    const [play] = useJarStore.getState().jars;
    useJarStore.getState().updateJar(play.id, { allocationPercent: 1 });

    useJarStore
      .getState()
      .addIncome({ amount: 100, date: "2026-08-24", note: "" });
    useJarStore
      .getState()
      .addExpense({ jarId: play.id, amount: 60, date: "2026-08-25", note: "" });
    expect(useJarStore.getState().expenses).toHaveLength(1);

    useJarStore
      .getState()
      .addExpense({ jarId: play.id, amount: 999, date: "2026-08-26", note: "" });
    expect(useJarStore.getState().expenses).toHaveLength(1);
  });

  it("moves money with transfers and rejects invalid ones", () => {
    useJarStore.getState().addJar("From");
    useJarStore.getState().addJar("To");
    const [from, to] = useJarStore.getState().jars;
    useJarStore.getState().updateJar(from.id, { allocationPercent: 1 });

    useJarStore
      .getState()
      .addIncome({ amount: 200, date: "2026-08-24", note: "" });

    useJarStore.getState().addTransfer({
      fromJarId: from.id,
      toJarId: from.id,
      amount: 10,
      date: "2026-08-24",
      note: "",
    });
    expect(useJarStore.getState().transfers).toHaveLength(0);

    useJarStore.getState().addTransfer({
      fromJarId: from.id,
      toJarId: to.id,
      amount: 300,
      date: "2026-08-24",
      note: "",
    });
    expect(useJarStore.getState().transfers).toHaveLength(0);

    useJarStore.getState().addTransfer({
      fromJarId: from.id,
      toJarId: to.id,
      amount: 50,
      date: "2026-08-24",
      note: "rebalance",
    });
    expect(useJarStore.getState().transfers).toHaveLength(1);

    const activity = computeJarActivity(
      useJarStore.getState().incomes,
      useJarStore.getState().expenses,
      useJarStore.getState().transfers
    );
    expect(activity.get(from.id)?.balance).toBe(150);
    expect(activity.get(to.id)?.balance).toBe(50);
  });

  it("refuses to delete a jar that has activity but allows unused ones", () => {
    useJarStore.getState().addJar("Used");
    useJarStore.getState().addJar("Unused");
    const [used, unused] = useJarStore.getState().jars;
    useJarStore.getState().updateJar(used.id, { allocationPercent: 1 });
    useJarStore
      .getState()
      .addIncome({ amount: 100, date: "2026-08-24", note: "" });

    useJarStore.getState().removeJar(unused.id);
    expect(
      useJarStore.getState().jars.some((jar) => jar.id === unused.id)
    ).toBe(false);

    useJarStore.getState().removeJar(used.id);
    expect(
      useJarStore.getState().jars.some((jar) => jar.id === used.id)
    ).toBe(true);
  });

  it("removes entries of every kind", () => {
    useJarStore.getState().addJar("Only");
    const [only] = useJarStore.getState().jars;
    useJarStore.getState().updateJar(only.id, { allocationPercent: 1 });
    useJarStore
      .getState()
      .addIncome({ amount: 90, date: "2026-08-24", note: "" });
    const income = useJarStore.getState().incomes[0];
    useJarStore.getState().removeIncome(income.id);
    expect(useJarStore.getState().incomes).toHaveLength(0);

    useJarStore
      .getState()
      .addIncome({ amount: 90, date: "2026-08-24", note: "" });
    useJarStore
      .getState()
      .addExpense({ jarId: only.id, amount: 30, date: "2026-08-25", note: "" });
    useJarStore
      .getState()
      .addTransfer({
        fromJarId: only.id,
        toJarId: only.id,
        amount: 5,
        date: "2026-08-25",
        note: "",
      });
    useJarStore.getState().removeExpense(useJarStore.getState().expenses[0].id);
    expect(useJarStore.getState().expenses).toHaveLength(0);
    expect(useJarStore.getState().transfers).toHaveLength(0);
  });

  it("resets to the empty state", () => {
    useJarStore.getState().addJar("Temp");
    useJarStore.getState().reset();
    expect(useJarStore.getState()).toMatchObject(EMPTY_JAR_STATE);
  });
});

describe("replaceAll (import path)", () => {
  it("replaces state wholesale after structural validation", () => {
    useJarStore.getState().addJar("Old data");
    useJarStore.getState().replaceAll(createJarDemoState());

    const state = useJarStore.getState();
    expect(state.jars).toHaveLength(6);
    expect(state.incomes).toHaveLength(3);
    expect(state.expenses).toHaveLength(5);
    expect(state.transfers).toHaveLength(2);
    expect(state.jars[0].id).toBe("demo-jar-nec");
  });

  it("rejects malformed payloads without touching current state", () => {
    useJarStore.getState().addJar("Keep me");
    const before = useJarStore.getState().jars;

    expect(() => useJarStore.getState().replaceAll(null)).toThrow(TypeError);
    expect(() => useJarStore.getState().replaceAll({})).toThrow(TypeError);
    expect(() =>
      useJarStore.getState().replaceAll({ jars: "nope" })
    ).toThrow(TypeError);
    expect(() =>
      useJarStore.getState().replaceAll({
        jars: [{ id: "x", name: "Broken", allocationPercent: -1 }],
        incomes: [],
        expenses: [],
        transfers: [],
      })
    ).toThrow(TypeError);
    expect(() =>
      useJarStore.getState().replaceAll({
        jars: [],
        incomes: [
          {
            id: "y",
            amount: 10,
            date: "not-a-date",
            note: "",
            allocations: [],
          },
        ],
        expenses: [],
        transfers: [],
      })
    ).toThrow(TypeError);

    expect(useJarStore.getState().jars.map((jar) => jar.id)).toEqual(
      before.map((jar) => jar.id)
    );
  });
});

describe("parseJarToolState", () => {
  it("accepts a minimal valid payload", () => {
    const parsed = parseJarToolState({
      jars: [{ id: "a", name: "A", allocationPercent: 1 }],
      incomes: [],
      expenses: [],
      transfers: [],
    });
    expect(parsed.jars[0]?.name).toBe("A");
  });

  it("exposes the export schema version for envelope writers", () => {
    expect(JAR_EXPORT_SCHEMA_VERSION).toBe(1);
  });
});

describe("demo seed", () => {
  it("is structurally valid and keeps balances consistent", () => {
    const demo = createJarDemoState();
    const parsed = parseJarToolState(demo);

    expect(parsed.jars.map((jar) => jar.allocationPercent)).toEqual([
      0.55, 0.1, 0.1, 0.1, 0.1, 0.05,
    ]);

    for (const income of parsed.incomes) {
      const total = income.allocations.reduce(
        (sum, allocation) => sum + allocation.amount,
        0
      );
      expect(total).toBeCloseTo(income.amount, 10);
    }

    const summary = summarizeJars(
      parsed.incomes,
      parsed.expenses,
      parsed.transfers
    );
    expect(summary.netOnHand).toBeGreaterThan(0);

    const activity = computeJarActivity(
      parsed.incomes,
      parsed.expenses,
      parsed.transfers
    );
    for (const jar of parsed.jars) {
      expect(activity.get(jar.id)?.balance ?? 0).toBeGreaterThanOrEqual(-1e-9);
    }
  });
});
