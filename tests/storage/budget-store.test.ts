import { beforeEach, describe, expect, it } from "vitest";
import { createBudgetDemoState } from "@/lib/demo/budget";
import {
  buildHealthCells,
  computeBudgetHealth,
  foldEntriesToMonths,
  summarizeCategory,
} from "@/lib/finance/budget";
import {
  BUDGET_EXPORT_SCHEMA_VERSION,
  EMPTY_BUDGET_STATE,
  parseBudgetToolState,
  useBudgetStore,
} from "@/lib/storage/budget-store";

const STORAGE_KEY = "finplan:budget:v1";
const ZERO_PLANS = Array(12).fill(0);

function freshState() {
  useBudgetStore.setState({ ...EMPTY_BUDGET_STATE });
}

beforeEach(() => {
  localStorage.clear();
  freshState();
});

describe("budget store actions", () => {
  it("starts empty with the current year", () => {
    expect(useBudgetStore.getState().categories).toEqual([]);
    expect(useBudgetStore.getState().entries).toEqual([]);
    expect(useBudgetStore.getState().year).toBe(new Date().getFullYear());
  });

  it("adds categories with zero plans and updates them", () => {
    const id = useBudgetStore.getState().addCategory("Groceries", "expense");
    const [category] = useBudgetStore.getState().categories;
    expect(category.name).toBe("Groceries");
    expect(category.kind).toBe("expense");
    expect(category.rolloverEnabled).toBe(false);
    expect(category.plans).toEqual(ZERO_PLANS);

    useBudgetStore
      .getState()
      .updateCategory(id, { name: "Food", kind: "savings", rolloverEnabled: true });
    expect(useBudgetStore.getState().categories[0]).toMatchObject({
      name: "Food",
      kind: "savings",
      rolloverEnabled: true,
    });
  });

  it("sets plans per month with clamping and persists to localStorage", () => {
    const id = useBudgetStore.getState().addCategory("Rent", "expense");
    useBudgetStore.getState().setPlan(id, 3, 1250);
    useBudgetStore.getState().setPlan(id, 4, -50);
    useBudgetStore.getState().setPlan(id, 5, null);
    useBudgetStore.getState().setPlan(id, 13, 999);

    const plans = useBudgetStore.getState().categories[0].plans;
    expect(plans[3]).toBe(1250);
    expect(plans[4]).toBe(0);
    expect(plans).toEqual(ZERO_PLANS.map((value, index) => (index === 3 ? 1250 : value)));

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.state.categories[0].plans[3]).toBe(1250);
    expect(persisted.version).toBe(1);
  });

  it("records entries only for known categories and valid inputs", () => {
    const id = useBudgetStore.getState().addCategory("Fun", "expense");

    useBudgetStore.getState().addEntry({
      categoryId: id,
      month: 7,
      amount: 24.5,
      date: "2026-08-01",
      note: "  cinema  ",
    });
    expect(useBudgetStore.getState().entries).toHaveLength(1);
    expect(useBudgetStore.getState().entries[0]).toMatchObject({
      categoryId: id,
      month: 7,
      amount: 24.5,
      note: "cinema",
    });

    useBudgetStore
      .getState()
      .addEntry({ categoryId: "missing", month: 7, amount: 5, date: "2026-08-01", note: "" });
    useBudgetStore
      .getState()
      .addEntry({ categoryId: id, month: 12, amount: 5, date: "2026-08-01", note: "" });
    useBudgetStore
      .getState()
      .addEntry({ categoryId: id, month: 7, amount: 0, date: "2026-08-01", note: "" });
    useBudgetStore
      .getState()
      .addEntry({
        categoryId: id,
        month: 7,
        amount: Number.POSITIVE_INFINITY,
        date: "2026-08-01",
        note: "",
      });
    expect(useBudgetStore.getState().entries).toHaveLength(1);
  });

  it("cascades category deletion into its entries", () => {
    const id = useBudgetStore.getState().addCategory("Gym", "expense");
    useBudgetStore
      .getState()
      .addEntry({ categoryId: id, month: 0, amount: 30, date: "2026-01-05", note: "" });
    const otherId = useBudgetStore.getState().addCategory("Keep", "savings");
    useBudgetStore
      .getState()
      .addEntry({ categoryId: otherId, month: 0, amount: 100, date: "2026-01-06", note: "" });

    useBudgetStore.getState().removeCategory(id);

    const state = useBudgetStore.getState();
    expect(state.categories.some((category) => category.id === id)).toBe(false);
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0].categoryId).toBe(otherId);
  });

  it("removes entries and resets", () => {
    const id = useBudgetStore.getState().addCategory("Temp", "expense");
    useBudgetStore
      .getState()
      .addEntry({ categoryId: id, month: 2, amount: 10, date: "2026-03-01", note: "" });
    const entry = useBudgetStore.getState().entries[0];
    useBudgetStore.getState().removeEntry(entry.id);
    expect(useBudgetStore.getState().entries).toHaveLength(0);

    useBudgetStore.getState().setYear(2030);
    useBudgetStore.getState().reset();
    expect(useBudgetStore.getState()).toMatchObject({
      year: new Date().getFullYear(),
      categories: [],
      entries: [],
    });
  });
});

describe("replaceAll (import path)", () => {
  it("replaces state wholesale after structural validation", () => {
    useBudgetStore.getState().addCategory("Old data", "expense");
    useBudgetStore.getState().replaceAll(createBudgetDemoState());

    const state = useBudgetStore.getState();
    expect(state.categories).toHaveLength(7);
    expect(state.entries.length).toBeGreaterThan(20);
    expect(state.categories[0].id).toBe("demo-budget-groceries");
  });

  it("rejects malformed payloads without touching current state", () => {
    useBudgetStore.getState().addCategory("Keep me", "expense");
    const before = useBudgetStore.getState().categories;

    expect(() => useBudgetStore.getState().replaceAll(null)).toThrow(TypeError);
    expect(() => useBudgetStore.getState().replaceAll({})).toThrow(TypeError);
    expect(() =>
      useBudgetStore.getState().replaceAll({ year: 2026, categories: "nope", entries: [] })
    ).toThrow(TypeError);
    expect(() =>
      useBudgetStore.getState().replaceAll({
        year: "2026",
        categories: [],
        entries: [],
      })
    ).toThrow(TypeError);
    expect(() =>
      useBudgetStore.getState().replaceAll({
        year: 2026,
        categories: [
          {
            id: "x",
            name: "Broken",
            kind: "income",
            rolloverEnabled: false,
            plans: ZERO_PLANS,
          },
        ],
        entries: [],
      })
    ).toThrow(TypeError);
    expect(() =>
      useBudgetStore.getState().replaceAll({
        year: 2026,
        categories: [
          {
            id: "x",
            name: "Broken",
            kind: "expense",
            rolloverEnabled: false,
            plans: [1, 2, 3],
          },
        ],
        entries: [],
      })
    ).toThrow(TypeError);
    expect(() =>
      useBudgetStore.getState().replaceAll({
        year: 2026,
        categories: [],
        entries: [
          {
            id: "e",
            categoryId: "x",
            month: 13,
            amount: 10,
            date: "2026-08-01",
            note: "",
          },
        ],
      })
    ).toThrow(TypeError);

    expect(useBudgetStore.getState().categories.map((category) => category.id)).toEqual(
      before.map((category) => category.id)
    );
  });
});

describe("parseBudgetToolState", () => {
  it("accepts a minimal valid payload", () => {
    const parsed = parseBudgetToolState({
      year: 2027,
      categories: [
        {
          id: "a",
          name: "A",
          kind: "savings",
          rolloverEnabled: true,
          plans: ZERO_PLANS,
        },
      ],
      entries: [],
    });
    expect(parsed.year).toBe(2027);
    expect(parsed.categories[0]?.rolloverEnabled).toBe(true);
  });

  it("exposes the export schema version for envelope writers", () => {
    expect(BUDGET_EXPORT_SCHEMA_VERSION).toBe(1);
  });
});

describe("demo seed", () => {
  it("is structurally valid through the import path", () => {
    const demo = createBudgetDemoState();
    const parsed = parseBudgetToolState(demo);
    expect(parsed.categories).toHaveLength(7);
    expect(
      parsed.entries.every((entry) =>
        parsed.categories.some((category) => category.id === entry.categoryId)
      )
    ).toBe(true);
  });

  it("produces a meaningful health score in the active window", () => {
    const demo = createBudgetDemoState();
    const actuals = foldEntriesToMonths(demo.entries);
    const summaries = demo.categories.map((category) =>
      summarizeCategory(category, actuals.get(category.id) ?? ZERO_PLANS)
    );
    const health = computeBudgetHealth(buildHealthCells(summaries));

    expect(health.score).not.toBeNull();
    expect(health.score!).toBeGreaterThanOrEqual(60);
    expect(health.score!).toBeLessThanOrEqual(100);
    expect(health.cellsEvaluated).toBeGreaterThanOrEqual(40);
    expect(health.cellsOverspent).toBeGreaterThan(0);
  });

  it("exercises rollover on at least one category", () => {
    const demo = createBudgetDemoState();
    expect(
      demo.categories.filter((category) => category.rolloverEnabled).length
    ).toBeGreaterThanOrEqual(4);
  });
});
