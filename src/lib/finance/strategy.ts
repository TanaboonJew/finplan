export type ThesisStatus = "idea" | "active" | "closed";
export type ScenarioOutcome = "bull" | "base" | "bear";
export type RiskLevel = "low" | "medium" | "high";

export interface Scenario {
  id: string;
  outcome: ScenarioOutcome;
  probability: number;
  expectedReturn: number;
  timeHorizonMonths: number;
  notes: string;
}

export interface Risk {
  id: string;
  name: string;
  level: RiskLevel;
  mitigation: string;
  notes: string;
}

export interface Thesis {
  id: string;
  title: string;
  assetClass: string;
  thesis: string;
  status: ThesisStatus;
  scenarios: Scenario[];
  risks: Risk[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyToolPersisted {
  theses: Thesis[];
}

export interface ThesisSummary {
  id: string;
  title: string;
  assetClass: string;
  status: ThesisStatus;
  scenarioCount: number;
  riskCount: number;
  highRiskCount: number;
  weightedReturn: number;
  overallRiskLevel: RiskLevel;
}

const RISK_ORDER: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
const RISK_BY_ORDER: RiskLevel[] = ["low", "medium", "high"];

export function weightedExpectedReturn(
  scenarios: readonly Scenario[]
): number {
  if (scenarios.length === 0) return 0;
  return scenarios.reduce(
    (sum, s) => sum + s.probability * s.expectedReturn,
    0
  );
}

export function highestRiskLevel(risks: readonly Risk[]): RiskLevel {
  let max = 0;
  for (const r of risks) {
    const idx = RISK_ORDER[r.level];
    if (idx > max) max = idx;
  }
  return RISK_BY_ORDER[max];
}

export function summarizeThesis(thesis: Thesis): ThesisSummary {
  const highRiskCount = thesis.risks.filter((r) => r.level === "high").length;
  return {
    id: thesis.id,
    title: thesis.title,
    assetClass: thesis.assetClass,
    status: thesis.status,
    scenarioCount: thesis.scenarios.length,
    riskCount: thesis.risks.length,
    highRiskCount,
    weightedReturn: weightedExpectedReturn(thesis.scenarios),
    overallRiskLevel: highestRiskLevel(thesis.risks),
  };
}

const STATUS_ORDER: Record<ThesisStatus, number> = {
  idea: 0,
  active: 1,
  closed: 2,
};

export function summarizeAllTheses(
  theses: readonly Thesis[]
): ThesisSummary[] {
  return theses
  .map(summarizeThesis)
  .sort((a, b) => {
    const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (s !== 0) return s;
    return a.title.localeCompare(b.title);
  });
}

export function exportBoardAsMarkdown(
  theses: readonly Thesis[],
  labels: {
    boardTitle: string;
    generatedAt: string;
    statusIdea: string;
    statusActive: string;
    statusClosed: string;
    scenariosLabel: string;
    risksLabel: string;
    noContent: string;
    scenarioHeaders: [string, string, string, string, string];
    riskHeaders: [string, string, string];
    returnLabel: string;
    horizonLabel: string;
    probabilityLabel: string;
    levelLabel: string;
    mitigationLabel: string;
    notesLabel: string;
  }
): string {
  const lines: string[] = [];
  lines.push(`# ${labels.boardTitle}`);
  lines.push("");
  lines.push(`*${labels.generatedAt}*`);
  lines.push("");

  const grouped: Record<ThesisStatus, Thesis[]> = {
    idea: [],
    active: [],
    closed: [],
  };
  for (const t of theses) {
    grouped[t.status].push(t);
  }

  const statusLabels: Record<ThesisStatus, string> = {
    idea: labels.statusIdea,
    active: labels.statusActive,
    closed: labels.statusClosed,
  };
  const statusOrder: ThesisStatus[] = ["idea", "active", "closed"];

  for (const status of statusOrder) {
    const group = grouped[status];
    lines.push(`## ${statusLabels[status]} (${group.length})`);
    lines.push("");
    if (group.length === 0) {
      lines.push(labels.noContent);
      lines.push("");
      continue;
    }
    for (const thesis of group) {
      lines.push(`### ${thesis.title}`);
      lines.push("");
      lines.push(`**${thesis.assetClass}**`);
      lines.push("");
      lines.push(thesis.thesis);
      lines.push("");
      if (thesis.scenarios.length > 0) {
        lines.push(`#### ${labels.scenariosLabel}`);
        lines.push("");
        const [h1, h2, h3, h4, h5] = labels.scenarioHeaders;
        lines.push(`| ${h1} | ${h2} | ${h3} | ${h4} | ${h5} |`);
        lines.push("|---|---|---|---|---|");
        for (const s of thesis.scenarios) {
          lines.push(
            `| ${s.outcome} | ${(s.probability * 100).toFixed(0)}% | ${(s.expectedReturn * 100).toFixed(1)}% | ${s.timeHorizonMonths}m | ${s.notes} |`
          );
        }
        lines.push("");
      }
      if (thesis.risks.length > 0) {
        lines.push(`#### ${labels.risksLabel}`);
        lines.push("");
        const [r1, r2, r3] = labels.riskHeaders;
        lines.push(`| ${r1} | ${r2} | ${r3} |`);
        lines.push("|---|---|---|");
        for (const r of thesis.risks) {
          lines.push(`| ${r.name} | ${r.level} | ${r.mitigation} |`);
        }
        lines.push("");
      }
      if (thesis.notes) {
        lines.push(`**${labels.notesLabel}:** ${thesis.notes}`);
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}
