import { describe, expect, it } from "vitest";
import { isQuizComplete, readinessLevel, totalScore } from "@/lib/finance/readiness";
import { createWakeUpDemoState } from "@/lib/demo/wake-up";

describe("wake-up demo seed", () => {
  it("answers all ten questions", () => {
    const demo = createWakeUpDemoState();
    expect(isQuizComplete(demo.answers)).toBe(true);
    expect(demo.completedAt).not.toBeNull();
  });

  it("produces an on-track readiness result", () => {
    const demo = createWakeUpDemoState();
    expect(readinessLevel(totalScore(demo.answers)).id).toBe("on-track");
  });

  it("survives the parser round-trip", async () => {
    const demo = createWakeUpDemoState();
    const { parseWakeUpToolState } = await import(
      "@/lib/storage/wake-up-store"
    );
    const parsed = parseWakeUpToolState(demo);
    expect(parsed.answers).toEqual(demo.answers);
  });
});
