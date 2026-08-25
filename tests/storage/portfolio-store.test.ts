import { beforeEach, describe, expect, it } from "vitest";
import {
  EMPTY_PORTFOLIO_STATE,
  PORTFOLIO_EXPORT_SCHEMA_VERSION,
  parsePortfolioToolState,
  usePortfolioStore,
} from "@/lib/storage/portfolio-store";

const sampleData = {
  holdings: [
    {
      id: "h1",
      symbol: "VTI",
      name: "Total market",
      assetClass: "Equity",
      quantity: 10,
      price: 100,
    },
    {
      id: "h2",
      symbol: "BND",
      name: "",
      assetClass: "",
      quantity: 5,
      price: 72,
    },
  ],
  targets: { Equity: 0.6, Bonds: 0.4 },
};

describe("portfolio store", () => {
  beforeEach(() => {
    localStorage.clear();
    usePortfolioStore.getState().reset();
  });

  it("starts empty", () => {
    expect(usePortfolioStore.getState()).toMatchObject(EMPTY_PORTFOLIO_STATE);
  });

  it("adds holdings with generated ids and updates by id", () => {
    const id = usePortfolioStore.getState().addHolding({
      symbol: "vti",
      name: "",
      assetClass: "Equity",
      quantity: 1,
      price: 50,
    });
    expect(id).toBeTruthy();
    usePortfolioStore.getState().updateHolding(id, { price: 60 });
    const holding = usePortfolioStore.getState().holdings[0]!;
    expect(holding.price).toBe(60);
    expect(holding.symbol).toBe("vti");
  });

  it("removes holdings by id", () => {
    const id = usePortfolioStore
      .getState()
      .addHolding({ symbol: "X", name: "", assetClass: "", quantity: 1, price: 1 });
    usePortfolioStore.getState().removeHolding(id);
    expect(usePortfolioStore.getState().holdings).toEqual([]);
  });

  it("setHoldings appends wholesale (used by CSV paste)", () => {
    usePortfolioStore.getState().setHoldings([
      { id: "a", symbol: "A", name: "", assetClass: "Cash", quantity: 1, price: 1 },
      { id: "b", symbol: "B", name: "", assetClass: "Gold", quantity: 2, price: 2 },
    ]);
    expect(usePortfolioStore.getState().holdings).toHaveLength(2);
  });

  it("clamps target weights into 0..1 and drops empty class names", () => {
    usePortfolioStore.getState().setTarget("Equity", 1.5);
    usePortfolioStore.getState().setTarget("Bonds", -0.5);
    usePortfolioStore.getState().setTarget("   ", 0.5);
    expect(usePortfolioStore.getState().targets).toEqual({
      Equity: 1,
      Bonds: 0,
    });
    usePortfolioStore.getState().removeTarget("Equity");
    expect(usePortfolioStore.getState().targets).toEqual({ Bonds: 0 });
  });

  it("replaceAll replaces wholesale from valid export data", () => {
    usePortfolioStore.getState().replaceAll(sampleData);
    expect(usePortfolioStore.getState().holdings).toHaveLength(2);
    expect(usePortfolioStore.getState().targets).toEqual(sampleData.targets);
  });

  it("reset restores the empty state", () => {
    usePortfolioStore.getState().replaceAll(sampleData);
    usePortfolioStore.getState().reset();
    expect(usePortfolioStore.getState()).toMatchObject(EMPTY_PORTFOLIO_STATE);
  });

  it("persists to localStorage", () => {
    usePortfolioStore.getState().replaceAll(sampleData);
    const raw = localStorage.getItem("finplan:portfolio:v1");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).state.holdings).toHaveLength(2);
  });

  it("exposes the export schema version", () => {
    expect(PORTFOLIO_EXPORT_SCHEMA_VERSION).toBe(1);
  });
});

describe("parsePortfolioToolState", () => {
  it("parses valid data and defaults blank classes", () => {
    const parsed = parsePortfolioToolState(sampleData);
    expect(parsed.holdings[1]!.assetClass).toBe("Uncategorized");
    expect(parsed.targets).toEqual(sampleData.targets);
  });

  it("defaults missing arrays and targets", () => {
    expect(parsePortfolioToolState({})).toMatchObject(EMPTY_PORTFOLIO_STATE);
    expect(parsePortfolioToolState({ holdings: [], targets: null })).toMatchObject(
      EMPTY_PORTFOLIO_STATE
    );
  });

  it("rejects non-object input", () => {
    expect(() => parsePortfolioToolState("bad")).toThrow(TypeError);
  });

  it("rejects invalid holding fields", () => {
    expect(() =>
      parsePortfolioToolState({
        holdings: [{ ...sampleData.holdings[0], quantity: -1 }],
        targets: {},
      })
    ).toThrow(TypeError);
    expect(() =>
      parsePortfolioToolState({
        holdings: [{ ...sampleData.holdings[0], symbol: 42 }],
        targets: {},
      })
    ).toThrow(TypeError);
  });

  it("ignores non-numeric or out-of-range targets", () => {
    const parsed = parsePortfolioToolState({
      holdings: [],
      targets: { A: 2, B: "x", C: -3 },
    });
    expect(parsed.targets).toEqual({ A: 1 });
  });
});
