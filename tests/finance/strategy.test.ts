import { describe, expect, it } from "vitest";
import {
  exportBoardAsMarkdown,
  highestRiskLevel,
  summarizeAllTheses,
  summarizeThesis,
  weightedExpectedReturn,
  type Risk,
  type Scenario,
  type Thesis,
} from "@/lib/finance/strategy";

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: "s1",
    outcome: "base",
    probability: 0.5,
    expectedReturn: 0.1,
    timeHorizonMonths: 12,
    notes: "",
    ...overrides,
  };
}

function makeRisk(overrides: Partial<Risk> = {}): Risk {
  return {
    id: "r1",
    name: "Valuation",
    level: "medium",
    mitigation: "",
    notes: "",
    ...overrides,
  };
}

function makeThesis(overrides: Partial<Thesis> = {}): Thesis {
  return {
    id: "t1",
    title: "Thesis A",
    assetClass: "Equity",
    thesis: "Growth compounds.",
    status: "idea",
    scenarios: [],
    risks: [],
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("weightedExpectedReturn", () => {
  it("returns 0 with no scenarios", () => {
    expect(weightedExpectedReturn([])).toBe(0);
  });

  it("returns the single scenario return times probability", () => {
    expect(
      weightedExpectedReturn([makeScenario({ probability: 1, expectedReturn: 0.12 })])
    ).toBeCloseTo(0.12);
  });

  it("sums probability-weighted returns across scenarios", () => {
    const scenarios = [
      makeScenario({ probability: 0.25, expectedReturn: 0.4 }),
      makeScenario({ probability: 0.5, expectedReturn: 0.1 }),
      makeScenario({ probability: 0.25, expectedReturn: -0.2 }),
    ];
    // 0.10 + 0.05 - 0.05 = 0.10
    expect(weightedExpectedReturn(scenarios)).toBeCloseTo(0.1, 12);
  });

  it("handles zero-probability and zero-return scenarios", () => {
    const scenarios = [
      makeScenario({ probability: 0, expectedReturn: 5 }),
      makeScenario({ probability: 1, expectedReturn: 0 }),
    ];
    expect(weightedExpectedReturn(scenarios)).toBe(0);
  });
});

describe("highestRiskLevel", () => {
  it("returns low when there are no risks", () => {
    expect(highestRiskLevel([])).toBe("low");
  });

  it("returns the only level present", () => {
    expect(highestRiskLevel([makeRisk({ level: "medium" })])).toBe("medium");
  });

  it("returns high when any risk is high regardless of order", () => {
    expect(
      highestRiskLevel([
        makeRisk({ level: "low" }),
        makeRisk({ level: "high" }),
        makeRisk({ level: "medium" }),
      ])
    ).toBe("high");
  });
});

describe("summarizeThesis", () => {
  it("summarizes counts and derived values", () => {
    const thesis = makeThesis({
      status: "active",
      scenarios: [
        makeScenario({ outcome: "bull", probability: 0.5, expectedReturn: 0.3 }),
        makeScenario({ outcome: "bear", probability: 0.5, expectedReturn: -0.1 }),
      ],
      risks: [makeRisk({ level: "high" }), makeRisk({ level: "low" })],
    });
    const summary = summarizeThesis(thesis);
    expect(summary.scenarioCount).toBe(2);
    expect(summary.riskCount).toBe(2);
    expect(summary.highRiskCount).toBe(1);
    expect(summary.weightedReturn).toBeCloseTo(0.1, 12);
    expect(summary.overallRiskLevel).toBe("high");
    expect(summary.status).toBe("active");
  });

  it("handles an empty thesis", () => {
    const summary = summarizeThesis(makeThesis());
    expect(summary.scenarioCount).toBe(0);
    expect(summary.riskCount).toBe(0);
    expect(summary.highRiskCount).toBe(0);
    expect(summary.weightedReturn).toBe(0);
    expect(summary.overallRiskLevel).toBe("low");
  });
});

describe("summarizeAllTheses", () => {
  it("sorts by status order then title", () => {
    const summaries = summarizeAllTheses([
      makeThesis({ id: "1", title: "Zebra", status: "closed" }),
      makeThesis({ id: "2", title: "Active B", status: "active" }),
      makeThesis({ id: "3", title: "Idea", status: "idea" }),
      makeThesis({ id: "4", title: "Active A", status: "active" }),
    ]);
    expect(summaries.map((s) => s.id)).toEqual(["3", "4", "2", "1"]);
  });

  it("returns an empty list for no theses", () => {
    expect(summarizeAllTheses([])).toEqual([]);
  });
});

describe("exportBoardAsMarkdown", () => {
  const labels = {
    boardTitle: "Board",
    generatedAt: "Generated",
    statusIdea: "Idea",
    statusActive: "Active",
    statusClosed: "Closed",
    scenariosLabel: "Scenarios",
    risksLabel: "Risks",
    noContent: "Nothing here.",
    scenarioHeaders: [
      "Outcome",
      "Prob",
      "Return",
      "Horizon",
      "Notes",
    ] as [string, string, string, string, string],
    riskHeaders: ["Name", "Level", "Mitigation"] as [string, string, string],
    returnLabel: "Return",
    horizonLabel: "Horizon",
    probabilityLabel: "Probability",
    levelLabel: "Level",
    mitigationLabel: "Mitigation",
    notesLabel: "Notes",
  };

  it("renders a header even for an empty board", () => {
    const md = exportBoardAsMarkdown([], labels);
    expect(md).toContain("# Board");
    expect(md).toContain("## Idea (0)");
    expect(md).toContain("Nothing here.");
  });

  it("groups theses under their status headings", () => {
    const md = exportBoardAsMarkdown(
      [
        makeThesis({ title: "Closed One", status: "closed" }),
        makeThesis({ title: "Idea One", status: "idea" }),
      ],
      labels
    );
    expect(md).toContain("## Idea (1)");
    expect(md).toContain("### Idea One");
    expect(md).toContain("## Closed (1)");
    expect(md).toContain("### Closed One");
  });

  it("includes scenario and risk tables plus thesis text", () => {
    const md = exportBoardAsMarkdown(
      [
        makeThesis({
          title: "Full",
          thesis: "The core idea.",
          scenarios: [
            makeScenario({
              outcome: "bull",
              probability: 0.25,
              expectedReturn: 0.35,
              timeHorizonMonths: 24,
            }),
          ],
          risks: [makeRisk({ name: "Regulation", level: "high" })],
          notes: "Watch quarterly.",
        }),
      ],
      labels
    );
    expect(md).toContain("The core idea.");
    expect(md).toContain("| Outcome | Prob | Return | Horizon | Notes |");
    expect(md).toContain("| bull | 25% | 35.0% | 24m |  |");
    expect(md).toContain("| Name | Level | Mitigation |");
    expect(md).toContain("| Regulation | high |  |");
    expect(md).toContain("**Notes:** Watch quarterly.");
  });

  it("keeps thesis body text intact in the export", () => {
    const md = exportBoardAsMarkdown(
      [makeThesis({ title: "Plain", notes: "" })],
      labels
    );
    expect(md).toContain("### Plain");
    expect(md).toContain("Growth compounds.");
    expect(md).not.toContain("| Outcome");
  });
});
