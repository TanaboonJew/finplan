import { describe, expect, it } from "vitest";
import { monthlyNet } from "@/lib/finance/statement";
import { createStatementDemoState } from "@/lib/demo/statement";

describe("statement demo seed", () => {
  it("holds twelve transactions across many categories and four rules", () => {
    const demo = createStatementDemoState();
    expect(demo.transactions).toHaveLength(12);
    expect(new Set(demo.transactions.map((t) => t.category)).size).toBeGreaterThanOrEqual(6);
    expect(demo.rules).toHaveLength(4);
  });

  it("has a positive net across the demo period", () => {
    const demo = createStatementDemoState();
    const net = demo.transactions.reduce((sum, t) => sum + t.amount, 0);
    expect(net).toBeGreaterThan(0);
  });

  it("spans two months", () => {
    const demo = createStatementDemoState();
    expect(monthlyNet(demo.transactions)).toHaveLength(2);
  });

  it("survives the store sanitizer round-trip", async () => {
    const demo = createStatementDemoState();
    const { parseStatementToolState } = await import(
      "@/lib/storage/statement-store"
    );
    const parsed = parseStatementToolState(demo);
    expect(parsed.transactions).toHaveLength(12);
    expect(parsed.rules).toEqual(demo.rules);
  });
});
