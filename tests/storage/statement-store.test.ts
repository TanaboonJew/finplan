import { beforeEach, describe, expect, it } from "vitest";
import {
  EMPTY_STATEMENT_STATE,
  STATEMENT_EXPORT_SCHEMA_VERSION,
  parseStatementToolState,
  useStatementStore,
} from "@/lib/storage/statement-store";

const sampleData = {
  transactions: [
    {
      id: "t1",
      date: "2026-08-01",
      description: "Salary",
      amount: 45000,
      category: "income",
    },
    {
      id: "t2",
      date: "2026-08-02",
      description: "Coffee",
      amount: -120,
      category: "",
    },
  ],
  rules: [
    { id: "r1", pattern: "coffee", category: "dining" },
    { id: "r2", pattern: "salary", category: "income" },
  ],
};

describe("statement store", () => {
  beforeEach(() => {
    localStorage.clear();
    useStatementStore.getState().reset();
  });

  it("starts empty", () => {
    expect(useStatementStore.getState()).toMatchObject(EMPTY_STATEMENT_STATE);
  });

  it("setTransactions imports and auto-applies rules", () => {
    useStatementStore.getState().replaceAll(sampleData);
    useStatementStore.getState().setTransactions([
      { id: "n1", date: "2026-08-03", description: "COFFEE cart", amount: -45, category: "uncategorized" },
    ]);
    const tx = useStatementStore.getState().transactions[0]!;
    expect(tx.category).toBe("dining");
  });

  it("updates categories and removes transactions", () => {
    useStatementStore.getState().setTransactions(sampleData.transactions as never);
    useStatementStore.getState().updateCategory("t2", "");
    expect(useStatementStore.getState().transactions[1]!.category).toBe(
      "uncategorized"
    );
    useStatementStore.getState().removeTransaction("t1");
    expect(useStatementStore.getState().transactions).toHaveLength(1);
  });

  it("manages rules and refuses empty patterns", () => {
    expect(
      useStatementStore.getState().addRule("  ", "dining")
    ).toBeNull();
    const id = useStatementStore.getState().addRule("grab", "transport");
    expect(id).toBeTruthy();
    useStatementStore.getState().updateRule(id!, { category: "commute" });
    expect(useStatementStore.getState().rules[0]!.category).toBe("commute");
    useStatementStore.getState().removeRule(id!);
    expect(useStatementStore.getState().rules).toEqual([]);
  });

  it("applyRulesToAll re-categorizes stored transactions", () => {
    useStatementStore.getState().replaceAll(sampleData);
    // Wipe the income category manually to prove rules restore it.
    useStatementStore
      .getState()
      .transactions.forEach((t) =>
        useStatementStore.getState().updateCategory(t.id, "uncategorized")
      );
    useStatementStore.getState().applyRulesToAll();
    expect(useStatementStore.getState().transactions[0]!.category).toBe(
      "income"
    );
  });

  it("replaceAll replaces wholesale from valid export data", () => {
    useStatementStore.getState().replaceAll(sampleData);
    expect(useStatementStore.getState().transactions).toHaveLength(2);
    expect(useStatementStore.getState().rules).toHaveLength(2);
    expect(useStatementStore.getState().transactions[1]!.category).toBe(
      "uncategorized"
    );
  });

  it("reset restores the empty state", () => {
    useStatementStore.getState().replaceAll(sampleData);
    useStatementStore.getState().reset();
    expect(useStatementStore.getState()).toMatchObject(EMPTY_STATEMENT_STATE);
  });

  it("persists to localStorage", () => {
    useStatementStore.getState().replaceAll(sampleData);
    const raw = localStorage.getItem("finplan:statement:v1");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).state.transactions).toHaveLength(2);
  });

  it("exposes the export schema version", () => {
    expect(STATEMENT_EXPORT_SCHEMA_VERSION).toBe(1);
  });
});

describe("parseStatementToolState", () => {
  it("rejects non-object input", () => {
    expect(() => parseStatementToolState(7)).toThrow(TypeError);
  });

  it("rejects invalid dates and amounts", () => {
    expect(() =>
      parseStatementToolState({
        transactions: [
          { id: "t1", date: "08/01/2026", description: "x", amount: 1 },
        ],
        rules: [],
      })
    ).toThrow(TypeError);
    expect(() =>
      parseStatementToolState({
        transactions: [
          { id: "t1", date: "2026-02-30", description: "x", amount: 1 },
        ],
        rules: [],
      })
    ).toThrow(TypeError);
    expect(() =>
      parseStatementToolState({
        transactions: [
          { id: "t1", date: "2026-08-01", description: "x", amount: Number.NaN },
        ],
        rules: [],
      })
    ).toThrow(TypeError);
  });

  it("defaults blank categories to uncategorized", () => {
    const parsed = parseStatementToolState(sampleData);
    expect(parsed.transactions[1]!.category).toBe("uncategorized");
  });
});
