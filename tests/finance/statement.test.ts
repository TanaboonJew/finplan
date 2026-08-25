import { describe, expect, it } from "vitest";
import {
  applyRules,
  isValidIsoDate,
  matchesRule,
  monthlyNet,
  normalizeDate,
  parseStatementCsv,
  summarizeByCategory,
  type CategoryRule,
  type StatementTransaction,
} from "@/lib/finance/statement";

function makeTx(overrides: Partial<StatementTransaction> = {}): StatementTransaction {
  return {
    id: "t1",
    date: "2026-08-01",
    description: "Test",
    amount: -10,
    category: "uncategorized",
    ...overrides,
  };
}

describe("isValidIsoDate", () => {
  it("accepts valid dates and rejects malformed or impossible ones", () => {
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true); // leap year
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2026-00-10")).toBe(false);
    expect(isValidIsoDate("01-02-2026")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
    expect(isValidIsoDate(42)).toBe(false);
    expect(isValidIsoDate(undefined)).toBe(false);
  });
});

describe("normalizeDate", () => {
  it("passes ISO through and normalizes slashed ISO", () => {
    expect(normalizeDate("2026-08-09", 1)).toBe("2026-08-09");
    expect(normalizeDate("2026/8/9", 1)).toBe("2026-08-09");
    expect(normalizeDate("2026.08.09", 1)).toBe("2026-08-09");
  });

  it("parses day-first DD/MM/YYYY", () => {
    // 05/06/2026 → June 5th (day-first even though day <= 12).
    expect(normalizeDate("05/06/2026", 1)).toBe("2026-06-05");
    expect(normalizeDate("31/12/2025", 1)).toBe("2025-12-31");
    expect(normalizeDate("31.01.2026", 2)).toBe("2026-01-31");
  });

  it("rejects invalid dates with the row number", () => {
    expect(() => normalizeDate("32/01/2026", 4)).toThrow(/row 4/);
    expect(() => normalizeDate("30/02/2026", 7)).toThrow(/row 7/);
    expect(() => normalizeDate("yesterday", 3)).toThrow(/row 3/);
  });
});

describe("parseStatementCsv", () => {
  it("parses headerless date,description,amount rows", () => {
    const txs = parseStatementCsv(
      "2026-08-01,Salary,45000\n2026-08-02,Coffee,-120.50\n"
    );
    expect(txs).toHaveLength(2);
    expect(txs[0]).toMatchObject({
      date: "2026-08-01",
      description: "Salary",
      amount: 45000,
      category: "uncategorized",
    });
    expect(txs[1]!.amount).toBe(-120.5);
    expect(new Set(txs.map((t) => t.id)).size).toBe(2);
  });

  it("detects common header aliases", () => {
    const txs = parseStatementCsv(
      "Posted Date,Narrative,Value\n2026-08-01,Top-up,500"
    );
    expect(txs[0]).toMatchObject({
      description: "Top-up",
      amount: 500,
    });
  });

  it("combines debit/credit columns as credit minus debit", () => {
    const txs = parseStatementCsv(
      "Date,Details,Debit,Credit\n2026-08-01,Bill pay,90,\n2026-08-02,Refund,,40.25"
    );
    expect(txs[0]!.amount).toBe(-90);
    expect(txs[1]!.amount).toBe(40.25);
  });

  it("handles quoted commas and semicolon delimiters with BOM", () => {
    const semi = parseStatementCsv(
      "\uFEFFdate;description;amount\n2026-08-01;\"Shop, Inc\";-12,50".replace(
        "-12,50",
        "-12.50"
      )
    );
    expect(semi[0]).toMatchObject({ description: "Shop, Inc", amount: -12.5 });
  });

  it("supports parenthesized negative amounts and DD/MM/YYYY dates in headers", () => {
    const txs = parseStatementCsv(
      "transactiondate,details,debit\n05/06/2026,Groceries,(250.00)"
    );
    expect(txs[0]).toMatchObject({
      date: "2026-06-05",
      amount: -250,
    });
  });

  it("throws TypeError on empty input", () => {
    expect(() => parseStatementCsv("")).toThrow(TypeError);
    expect(() => parseStatementCsv("\n\n")).toThrow(TypeError);
  });

  it("reports bad rows with their row number", () => {
    expect(() =>
      parseStatementCsv("Date,Description,Amount\n2026-13-40,Bad date,1")
    ).toThrow(RangeError);
    expect(() =>
      parseStatementCsv("Date,Description,Amount\n2026-08-01,,5")
    ).toThrow(/description/i);
    expect(() =>
      parseStatementCsv("Date,Description,Amount\n2026-08-01,X,abc")
    ).toThrow(/row 2.*amount/i);
  });

  it("throws when a header exists but has no data rows", () => {
    expect(() => parseStatementCsv("Date,Description,Amount")).toThrow(
      RangeError
    );
  });
});

describe("rules engine", () => {
  const rules: CategoryRule[] = [
    { id: "r1", pattern: "starbucks", category: "dining" },
    { id: "r2", pattern: "grab", category: "transport" },
  ];

  it("matches case-insensitively on substring", () => {
    expect(matchesRule("STARBUCKS CentralWorld", "starbucks")).toBe(true);
    expect(matchesRule("GrabBike ride", "grab")).toBe(true);
    expect(matchesRule("Big C", "grab")).toBe(false);
  });

  it("never matches an empty pattern", () => {
    expect(matchesRule("Anything", "")).toBe(false);
    expect(matchesRule("Anything", "   ")).toBe(false);
  });

  it("applies first matching rule and leaves others untouched (immutably)", () => {
    const txs = [
      makeTx({ id: "a", description: "STARBUCKS coffee" }),
      makeTx({ id: "b", description: "GRAB bike" }),
      makeTx({ id: "c", description: "Mystery" }),
    ];
    const categorized = applyRules(txs, [
      rules[0],
      { id: "late", pattern: "starbucks", category: "shopping" },
    ]);
    expect(categorized.find((t) => t.id === "a")!.category).toBe("dining");
    expect(categorized.find((t) => t.id === "b")!.category).toBe(
      "uncategorized"
    );
    expect(categorized.find((t) => t.id === "c")!.category).toBe(
      "uncategorized"
    );
    expect(categorized).not.toBe(txs);
    expect(txs[0]!.category).toBe("uncategorized");
  });

  it("handles unicode descriptions", () => {
    expect(matchesRule("กาแฟ Starbucks สยาม", "starbucks")).toBe(true);
  });
});

describe("summaries", () => {
  it("groups by category sorted by absolute total", () => {
    const summary = summarizeByCategory([
      makeTx({ category: "income", amount: 100 }),
      makeTx({ category: "dining", amount: -60 }),
      makeTx({ category: "income", amount: 20 }),
    ]);
    expect(summary.map((s) => s.category)).toEqual(["income", "dining"]);
    expect(summary[0]).toMatchObject({ total: 120, count: 2 });
  });

  it("summarizes empty input to nothing", () => {
    expect(summarizeByCategory([])).toEqual([]);
  });

  it("computes monthly net sorted ascending", () => {
    const months = monthlyNet([
      makeTx({ date: "2026-08-05", amount: -10 }),
      makeTx({ date: "2026-07-01", amount: 100 }),
      makeTx({ date: "2026-08-01", amount: -20 }),
    ]);
    expect(months).toEqual([
      { month: "2026-07", net: 100 },
      { month: "2026-08", net: -30 },
    ]);
  });
});
