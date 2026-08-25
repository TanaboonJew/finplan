import { describe, expect, it } from "vitest";
import { createPayDemoSnapshot } from "@/lib/demo/pay";

describe("pay demo seed", () => {
  it("produces a complete snapshot", () => {
    const snapshot = createPayDemoSnapshot();
    expect(snapshot.subscriptions.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.currency).toBe("USD");
    for (const sub of snapshot.subscriptions) {
      expect(sub.id).toBeTruthy();
      expect(sub.name.length).toBeGreaterThan(0);
      expect(sub.amount).toBeGreaterThan(0);
      expect(["monthly", "yearly"]).toContain(sub.cycle);
      expect(sub.priceHistory.length).toBeGreaterThanOrEqual(1);
      expect(sub.startDate).toMatch(/^\d{4}-\d{2}$/);
      expect(sub.renewalDay).toBeGreaterThanOrEqual(1);
      expect(sub.renewalDay).toBeLessThanOrEqual(28);
    }
  });

  it("has at least one subscription with price history > 1", () => {
    const snapshot = createPayDemoSnapshot();
    const withIncreases = snapshot.subscriptions.filter(
      (s) => s.priceHistory.length > 1
    );
    expect(withIncreases.length).toBeGreaterThanOrEqual(1);
  });
});
