import { describe, expect, it } from "vitest";
import { summarizeAllTheses } from "@/lib/finance/strategy";
import { createStrategyDemoState } from "@/lib/demo/strategy";

describe("strategy demo seed", () => {
  it("produces four theses across all statuses", () => {
    const snapshot = createStrategyDemoState();
    expect(snapshot.theses).toHaveLength(4);
    const statuses = new Set(snapshot.theses.map((t) => t.status));
    expect(statuses).toEqual(new Set(["idea", "active", "closed"]));
  });

  it("gives every thesis at least one scenario and one risk", () => {
    const snapshot = createStrategyDemoState();
    for (const thesis of snapshot.theses) {
      expect(thesis.scenarios.length).toBeGreaterThanOrEqual(1);
      expect(thesis.risks.length).toBeGreaterThanOrEqual(1);
      expect(thesis.title.length).toBeGreaterThan(0);
      expect(thesis.assetClass.length).toBeGreaterThan(0);
    }
  });

  it("has scenario probabilities within 0..1", () => {
    const snapshot = createStrategyDemoState();
    for (const thesis of snapshot.theses) {
      for (const scenario of thesis.scenarios) {
        expect(scenario.probability).toBeGreaterThan(0);
        expect(scenario.probability).toBeLessThanOrEqual(1);
        expect(Number.isFinite(scenario.expectedReturn)).toBe(true);
        expect(scenario.timeHorizonMonths).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("is structurally valid against the summarizer and parser", async () => {
    const snapshot = createStrategyDemoState();
    const summaries = summarizeAllTheses(snapshot.theses);
    expect(summaries).toHaveLength(4);

    const { parseStrategyToolState } = await import(
      "@/lib/storage/strategy-store"
    );
    expect(() => parseStrategyToolState(snapshot)).not.toThrow();
  });
});
