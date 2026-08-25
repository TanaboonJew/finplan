import { describe, expect, it } from "vitest";
import {
  allocations,
  concentrationWarnings,
  driftVsTargets,
  holdingValue,
  largestDrift,
  parseHoldingsCsv,
  totalValue,
  type Holding,
} from "@/lib/finance/portfolio";

function makeHolding(overrides: Partial<Holding> = {}): Holding {
  return {
    id: "h1",
    symbol: "VTI",
    name: "",
    assetClass: "Equity",
    quantity: 10,
    price: 100,
    ...overrides,
  };
}

describe("holdingValue / totalValue", () => {
  it("multiplies quantity by price", () => {
    expect(holdingValue(makeHolding({ quantity: 2.5, price: 4 }))).toBe(10);
  });

  it("handles zero quantities and prices", () => {
    expect(holdingValue(makeHolding({ quantity: 0, price: 50 }))).toBe(0);
    expect(holdingValue(makeHolding({ quantity: 5, price: 0 }))).toBe(0);
  });

  it("sums values across holdings and returns 0 for empty", () => {
    const holdings = [
      makeHolding({ quantity: 1, price: 10 }),
      makeHolding({ quantity: 3, price: 5 }),
    ];
    expect(totalValue(holdings)).toBe(25);
    expect(totalValue([])).toBe(0);
  });
});

describe("allocations", () => {
  it("groups by class and computes weights sorted by value desc", () => {
    const holdings = [
      makeHolding({ id: "1", assetClass: "Equity", quantity: 6, price: 10 }),
      makeHolding({ id: "2", assetClass: "Bonds", quantity: 4, price: 10 }),
      makeHolding({ id: "3", assetClass: "Equity", quantity: 0, price: 0 }),
      makeHolding({ id: "4", assetClass: "Cash", quantity: 10, price: 0.00001 }),
    ];
    const allocs = allocations(holdings);
    expect(allocs.map((a) => a.assetClass)).toEqual([
      "Equity",
      "Bonds",
      "Cash",
    ]);
    expect(allocs[0]!.weight).toBeCloseTo(60 / 100.0001, 5);
  });

  it("treats blank classes as Uncategorized", () => {
    const allocs = allocations([makeHolding({ assetClass: "" })]);
    expect(allocs[0]!.assetClass).toBe("Uncategorized");
    expect(allocs[0]!.weight).toBe(1);
  });

  it("returns empty list for an empty portfolio", () => {
    expect(allocations([])).toEqual([]);
  });
});

describe("concentrationWarnings", () => {
  it("is silent for an empty or zero-value portfolio", () => {
    expect(concentrationWarnings([])).toEqual([]);
    expect(
      concentrationWarnings([makeHolding({ quantity: 0, price: 0 })])
    ).toEqual([]);
  });

  it("fires exactly at the boundary conditions (>20%, >60%)", () => {
    // Exactly 20% positions across five distinct classes: silent.
    const classes = ["Equity", "Bonds", "Cash", "Gold", "Crypto"];
    const balanced = classes.map((assetClass, i) =>
      makeHolding({
        id: String(i),
        symbol: `S${i}`,
        assetClass,
        quantity: 20,
        price: 10,
      })
    );
    expect(concentrationWarnings(balanced)).toEqual([]);

    // A single 21% position warns; every class stays under 60%.
    const tilted = [
      ...balanced.slice(0, 4),
      makeHolding({ id: "big", symbol: "BIG", assetClass: "REIT", quantity: 21, price: 10 }),
    ];
    const warnings = concentrationWarnings(tilted);
    expect(warnings).toContainEqual({
      kind: "position",
      id: "big",
      symbol: "BIG",
      weight: 21 / 101,
    });
    expect(warnings.filter((w) => w.kind === "class")).toHaveLength(0);

    // One class above 60% triggers the class warning too.
    const concentrated = [
      makeHolding({ id: "x", assetClass: "Equity", quantity: 61, price: 10 }),
      makeHolding({ id: "y", assetClass: "Bonds", quantity: 39, price: 10 }),
    ];
    const classWarnings = concentrationWarnings(concentrated);
    expect(classWarnings).toContainEqual({
      kind: "class",
      assetClass: "Equity",
      weight: 0.61,
    });
    // Both positions breach the 20% single-position rule (61% and 39%).
    expect(classWarnings.filter((w) => w.kind === "position")).toHaveLength(2);
  });
});

describe("driftVsTargets / largestDrift", () => {
  it("unions holding classes with target-only classes", () => {
    const rows = driftVsTargets(
      [makeHolding({ assetClass: "Equity" })],
      { Equity: 0.5, Bonds: 0.5 }
    );
    const classes = rows.map((r) => r.assetClass).sort();
    expect(classes).toEqual(["Bonds", "Equity"]);
    const equity = rows.find((r) => r.assetClass === "Equity")!;
    expect(equity.actual).toBe(1);
    expect(equity.target).toBe(0.5);
    expect(equity.delta).toBeCloseTo(0.5, 12);
    const bonds = rows.find((r) => r.assetClass === "Bonds")!;
    expect(bonds.actual).toBe(0);
    expect(bonds.delta).toBe(-0.5);
  });

  it("sorts by absolute delta descending", () => {
    const rows = driftVsTargets(
      [
        makeHolding({ id: "1", assetClass: "A", quantity: 45, price: 1 }),
        makeHolding({ id: "2", assetClass: "B", quantity: 55, price: 1 }),
      ],
      { A: 0.4, B: 0.6 }
    );
    expect(Math.abs(rows[0]!.delta)).toBeGreaterThanOrEqual(
      Math.abs(rows[rows.length - 1]!.delta)
    );
    // Perfect match case: deltas are zero.
    const flat = driftVsTargets(
      [
        makeHolding({ id: "1", assetClass: "A", quantity: 40, price: 1 }),
        makeHolding({ id: "2", assetClass: "B", quantity: 60, price: 1 }),
      ],
      { A: 0.4, B: 0.6 }
    );
    expect(largestDrift(flat)!.delta).toBeCloseTo(0, 12);
  });

  it("clamps out-of-range targets", () => {
    const rows = driftVsTargets([], { A: 5, B: -1 });
    expect(rows.find((r) => r.assetClass === "A")!.target).toBe(1);
    expect(rows.find((r) => r.assetClass === "B")!.target).toBe(0);
  });

  it("returns null drift for empty input", () => {
    expect(largestDrift([])).toBeNull();
  });
});

describe("parseHoldingsCsv", () => {
  it("parses headerless symbol,quantity,price rows", () => {
    const holdings = parseHoldingsCsv("VTI,10.5,268.40\nBND,20,72.10\n");
    expect(holdings).toHaveLength(2);
    expect(holdings[0]).toMatchObject({
      symbol: "VTI",
      quantity: 10.5,
      price: 268.4,
    });
    expect(new Set(holdings.map((h) => h.id)).size).toBe(2);
  });

  it("detects headers with aliases and optional columns", () => {
    const csv =
      "Ticker,Qty,Price per unit,Name,class\nAAPL,5,190.5,Apple Inc,Equity";
    const holdings = parseHoldingsCsv(csv);
    expect(holdings).toHaveLength(1);
    expect(holdings[0]).toMatchObject({
      symbol: "AAPL",
      name: "Apple Inc",
      assetClass: "Equity",
      quantity: 5,
      price: 190.5,
    });
  });

  it("accepts semicolon and tab delimiters plus quoted commas and BOM", () => {
    const semi = parseHoldingsCsv("symbol;name;quantity;price\nVWRA;\"Fund, World\";3;100");
    expect(semi[0]).toMatchObject({ name: "Fund, World", quantity: 3, price: 100 });

    const tab = parseHoldingsCsv("\uFEFFsymbol\tname\tquantity\tprice\nGOLD\tX\t2\t55");
    expect(tab[0]!.quantity).toBe(2);
    expect(tab[0]!.price).toBe(55);

    const quoted = parseHoldingsCsv('symbol,name,quantity,price\n"A""2"", inc",X,1,9');
    expect(quoted[0]!.symbol).toBe('A"2", INC');
  });

  it("normalizes symbols to uppercase and defaults missing class", () => {
    const holdings = parseHoldingsCsv("vti,10,268.4");
    expect(holdings[0]!.symbol).toBe("VTI");
    expect(holdings[0]!.name).toBe("");
    expect(holdings[0]!.assetClass).toBe("Uncategorized");
  });

  it("throws TypeError on empty input", () => {
    expect(() => parseHoldingsCsv("")).toThrow(TypeError);
    expect(() => parseHoldingsCsv("   \n  \n")).toThrow(TypeError);
  });

  it("reports malformed rows with their line number", () => {
    expect(() =>
      parseHoldingsCsv("GOOD,1,1\nBAD,abc,1")
    ).toThrow(/row 2.*quantity/i);

    expect(() => parseHoldingsCsv(",1,1")).toThrow(/row 1.*symbol/i);
    expect(() => parseHoldingsCsv("NEG,-1,5")).toThrow(/row 1.*quantity/i);
    expect(() => parseHoldingsCsv("NEG,1,-5")).toThrow(/row 1.*price/i);
  });

  it("rejects header rows that miss required columns as data errors", () => {
    // Not a recognizable header → treated as a data row → bad quantity.
    expect(() => parseHoldingsCsv("My,Portfolio,Export\nA,1")).toThrow(RangeError);
  });
});
