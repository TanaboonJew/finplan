import { beforeEach, describe, expect, it } from "vitest";
import {
  EMPTY_STRATEGY_STATE,
  STRATEGY_EXPORT_SCHEMA_VERSION,
  parseStrategyToolState,
  useStrategyStore,
} from "@/lib/storage/strategy-store";

const sampleData = {
  theses: [
    {
      id: "t1",
      title: "AI Infrastructure Play",
      assetClass: "Equity",
      thesis: "Hyperscaler capex sustains growth.",
      status: "active",
      scenarios: [
        {
          id: "s1",
          outcome: "bull",
          probability: 0.25,
          expectedReturn: 0.35,
          timeHorizonMonths: 24,
          notes: "Adoption exceeds expectations",
        },
      ],
      risks: [
        {
          id: "r1",
          name: "Valuation stretch",
          level: "high",
          mitigation: "Position sizing capped",
          notes: "",
        },
      ],
      notes: "Review quarterly.",
      createdAt: "2025-10-15T08:00:00.000Z",
      updatedAt: "2026-01-20T10:30:00.000Z",
    },
  ],
};

describe("strategy store", () => {
  beforeEach(() => {
    localStorage.clear();
    useStrategyStore.getState().reset();
  });

  it("starts empty", () => {
    expect(useStrategyStore.getState().theses).toEqual([]);
  });

  it("adds a thesis with generated id and timestamps", () => {
    const id = useStrategyStore.getState().addThesis({
      title: "New idea",
      assetClass: "Equity",
      thesis: "",
      status: "idea",
      scenarios: [],
      risks: [],
      notes: "",
    });
    expect(id).toBeTruthy();
    const thesis = useStrategyStore.getState().theses[0];
    expect(thesis?.id).toBe(id);
    expect(thesis?.createdAt).toBe(thesis?.updatedAt);
    expect(new Date(thesis!.createdAt).getTime()).not.toBeNaN();
  });

  it("updates a thesis and bumps updatedAt", () => {
    const id = useStrategyStore.getState().addThesis({
      title: "Old",
      assetClass: "",
      thesis: "",
      status: "idea",
      scenarios: [],
      risks: [],
      notes: "",
    });
    const before = useStrategyStore.getState().theses[0]!;
    useStrategyStore.getState().updateThesis(id, { title: "New" });
    const after = useStrategyStore.getState().theses[0]!;
    expect(after.title).toBe("New");
    expect(after.createdAt).toBe(before.createdAt);
  });

  it("removes a thesis", () => {
    const id = useStrategyStore.getState().addThesis({
      title: "Temp",
      assetClass: "",
      thesis: "",
      status: "idea",
      scenarios: [],
      risks: [],
      notes: "",
    });
    useStrategyStore.getState().removeThesis(id);
    expect(useStrategyStore.getState().theses).toEqual([]);
  });

  it("adds, updates, and removes nested scenarios", () => {
    const id = useStrategyStore.getState().addThesis({
      title: "T",
      assetClass: "",
      thesis: "",
      status: "idea",
      scenarios: [],
      risks: [],
      notes: "",
    });
    const sid = useStrategyStore.getState().addScenario(id, {
      outcome: "base",
      probability: 0.5,
      expectedReturn: 0.1,
      timeHorizonMonths: 12,
      notes: "",
    });
    expect(useStrategyStore.getState().theses[0]!.scenarios).toHaveLength(1);

    useStrategyStore.getState().updateScenario(id, sid, { probability: 0.9 });
    const scenario = useStrategyStore.getState().theses[0]!.scenarios[0]!;
    expect(scenario.probability).toBe(0.9);
    expect(scenario.outcome).toBe("base");

    useStrategyStore.getState().removeScenario(id, sid);
    expect(useStrategyStore.getState().theses[0]!.scenarios).toEqual([]);
  });

  it("adds, updates, and removes nested risks", () => {
    const id = useStrategyStore.getState().addThesis({
      title: "T",
      assetClass: "",
      thesis: "",
      status: "idea",
      scenarios: [],
      risks: [],
      notes: "",
    });
    const rid = useStrategyStore.getState().addRisk(id, {
      name: "Liquidity",
      level: "medium",
      mitigation: "",
      notes: "",
    });
    expect(useStrategyStore.getState().theses[0]!.risks).toHaveLength(1);

    useStrategyStore.getState().updateRisk(id, rid, { level: "low" });
    expect(useStrategyStore.getState().theses[0]!.risks[0]!.level).toBe("low");

    useStrategyStore.getState().removeRisk(id, rid);
    expect(useStrategyStore.getState().theses[0]!.risks).toEqual([]);
  });

  it("replaceAll replaces state wholesale from valid export data", () => {
    useStrategyStore.getState().replaceAll(sampleData);
    expect(useStrategyStore.getState().theses).toHaveLength(1);
    expect(useStrategyStore.getState().theses[0]!.title).toBe(
      "AI Infrastructure Play"
    );
  });

  it("reset restores the empty state", () => {
    useStrategyStore.getState().replaceAll(sampleData);
    useStrategyStore.getState().reset();
    expect(useStrategyStore.getState().theses).toEqual([]);
    expect(useStrategyStore.getState()).toMatchObject(EMPTY_STRATEGY_STATE);
  });

  it("exposes the export schema version", () => {
    expect(STRATEGY_EXPORT_SCHEMA_VERSION).toBe(1);
  });

  it("persists to localStorage", () => {
    useStrategyStore.getState().replaceAll(sampleData);
    const raw = localStorage.getItem("finplan:strategy:v1");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).state.theses).toHaveLength(1);
  });
});

describe("parseStrategyToolState", () => {
  it("parses valid data", () => {
    const result = parseStrategyToolState(sampleData);
    expect(result.theses).toHaveLength(1);
    expect(result.theses[0]!.scenarios[0]!.probability).toBe(0.25);
  });

  it("defaults missing arrays to empty", () => {
    const result = parseStrategyToolState({});
    expect(result.theses).toEqual([]);
  });

  it("rejects non-object input", () => {
    expect(() => parseStrategyToolState("bad")).toThrow(TypeError);
    expect(() => parseStrategyToolState(null)).toThrow(TypeError);
  });

  it("rejects invalid status", () => {
    expect(() =>
      parseStrategyToolState({
        theses: [{ ...sampleData.theses[0], status: "archived" }],
      })
    ).toThrow(TypeError);
  });

  it("rejects invalid scenario outcome", () => {
    expect(() =>
      parseStrategyToolState({
        theses: [
          {
            ...sampleData.theses[0],
            scenarios: [
              {
                id: "s1",
                outcome: "mega",
                probability: 0.5,
                expectedReturn: 0.1,
                timeHorizonMonths: 12,
                notes: "",
              },
            ],
          },
        ],
      })
    ).toThrow(TypeError);
  });

  it("rejects negative probability", () => {
    expect(() =>
      parseStrategyToolState({
        theses: [
          {
            ...sampleData.theses[0],
            scenarios: [
              {
                id: "s1",
                outcome: "bull",
                probability: -0.5,
                expectedReturn: 0.1,
                timeHorizonMonths: 12,
                notes: "",
              },
            ],
          },
        ],
      })
    ).toThrow(TypeError);
  });

  it("rejects horizon below one month", () => {
    expect(() =>
      parseStrategyToolState({
        theses: [
          {
            ...sampleData.theses[0],
            scenarios: [
              {
                id: "s1",
                outcome: "bull",
                probability: 0.5,
                expectedReturn: 0.1,
                timeHorizonMonths: 0,
                notes: "",
              },
            ],
          },
        ],
      })
    ).toThrow(TypeError);
  });

  it("rejects invalid risk level", () => {
    expect(() =>
      parseStrategyToolState({
        theses: [
          {
            ...sampleData.theses[0],
            risks: [{ id: "r1", name: "X", level: "extreme" }],
          },
        ],
      })
    ).toThrow(TypeError);
  });

  it("rejects missing thesis title", () => {
    expect(() =>
      parseStrategyToolState({
        theses: [{ ...sampleData.theses[0], title: undefined }],
      })
    ).toThrow(TypeError);
  });
});
