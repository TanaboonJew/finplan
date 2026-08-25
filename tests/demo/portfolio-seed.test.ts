import { describe, expect, it } from "vitest";
import { concentrationWarnings } from "@/lib/finance/portfolio";
import { createPortfolioDemoState } from "@/lib/demo/portfolio";

describe("portfolio demo seed", () => {
  it("holds six holdings across five asset classes", () => {
    const demo = createPortfolioDemoState();
    expect(demo.holdings).toHaveLength(6);
    const classes = new Set(demo.holdings.map((h) => h.assetClass));
    expect(classes.size).toBe(5);
  });

  it("has valid amounts and full target coverage", () => {
    const demo = createPortfolioDemoState();
    for (const holding of demo.holdings) {
      expect(holding.symbol.length).toBeGreaterThan(0);
      expect(holding.quantity).toBeGreaterThan(0);
      expect(holding.price).toBeGreaterThan(0);
      expect(demo.targets[holding.assetClass]).toBeDefined();
    }
  });

  it("triggers at least one concentration warning", () => {
    const demo = createPortfolioDemoState();
    expect(concentrationWarnings(demo.holdings).length).toBeGreaterThanOrEqual(1);
  });

  it("survives the store parser round-trip", async () => {
    const demo = createPortfolioDemoState();
    const { parsePortfolioToolState } = await import(
      "@/lib/storage/portfolio-store"
    );
    const parsed = parsePortfolioToolState(demo);
    expect(parsed.holdings).toHaveLength(6);
    expect(parsed.targets).toEqual(demo.targets);
  });
});
