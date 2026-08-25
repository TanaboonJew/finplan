# Spec — Investment strategy board (`/strategy`)

Phase 14 · MASTER-PLAN section 6 row 14. Thesis/scenario/risk cards on a
kanban-style visual board; export board as markdown as the improvement.

## 1. Purpose

Let a user capture investment theses (ideas), attach bull/base/bear
scenarios to each thesis, and tag risks. The board visualizes all theses as
cards in a kanban-style layout grouped by status (idea / active / closed),
with scenario summaries and risk counts visible at a glance. The board can
be exported as a formatted markdown document for sharing or record-keeping.

## 2. Data model

Money is plain major-unit numbers; rates are decimal fractions (0.08 = 8%).
All persisted via Zustand + localStorage.

```ts
type ThesisStatus = "idea" | "active" | "closed";
type ScenarioOutcome = "bull" | "base" | "bear";
type RiskLevel = "low" | "medium" | "high";

interface Scenario {
  id: string;                     // crypto.randomUUID()
  outcome: ScenarioOutcome;
  probability: number;            // 0–1, all scenarios per thesis should sum to ~1
  expectedReturn: number;         // annual % as decimal, e.g. 0.12 = 12%
  timeHorizonMonths: number;      // >= 1
  notes: string;
}

interface Risk {
  id: string;                     // crypto.randomUUID()
  name: string;                   // e.g. "Regulatory change"
  level: RiskLevel;
  mitigation: string;             // what the user plans to do about it
  notes: string;
}

interface Thesis {
  id: string;                     // crypto.randomUUID()
  title: string;                  // e.g. "Emerging market bonds"
  assetClass: string;             // e.g. "Fixed income", "Equity", "Crypto"
  thesis: string;                 // free-text investment thesis
  status: ThesisStatus;
  scenarios: Scenario[];
  risks: Risk[];
  notes: string;
  createdAt: string;              // ISO timestamp
  updatedAt: string;              // ISO timestamp
}

interface StrategyToolPersisted {
  theses: Thesis[];
}

// Derived types (not persisted)
interface ThesisSummary {
  id: string;
  title: string;
  assetClass: string;
  status: ThesisStatus;
  scenarioCount: number;
  riskCount: number;
  highRiskCount: number;
  weightedReturn: number;         // probability-weighted expected return
  overallRiskLevel: RiskLevel;    // highest risk level present
}
```

Derived values (weighted returns, summary stats) are recomputed on render via
pure functions and never persisted.

## 3. Pure math — `src/lib/finance/strategy.ts`

All pure, no React, Vitest-covered.

```ts
function weightedExpectedReturn(scenarios: readonly Scenario[]): number;

function highestRiskLevel(risks: readonly Risk[]): RiskLevel;

function summarizeThesis(thesis: Thesis): ThesisSummary;

function summarizeAllTheses(theses: readonly Thesis[]): ThesisSummary[];

function exportBoardAsMarkdown(
  theses: readonly Thesis[],
  t: (key: string) => string
): string;
```

Key behavior:
- `weightedExpectedReturn`: sum of (probability × expectedReturn) across all
  scenarios. If no scenarios, returns 0.
- `highestRiskLevel`: returns the highest risk level present ("high" > "medium"
  > "low"). If no risks, returns "low".
- `summarizeThesis`: computes all derived fields for a single thesis.
- `summarizeAllTheses`: maps over all theses, returns sorted by status
  (idea → active → closed), then by title.
- `exportBoardAsMarkdown`: produces a full markdown document with sections
  for each status group, each thesis as a heading, with scenario table and
  risk list. The `t` function provides i18n strings for headers/labels.
- Edge cases: zero theses → empty markdown header; no scenarios → weighted
  return 0; no risks → risk level "low".

## 4. Store — `src/lib/storage/strategy-store.ts`

- Zustand + `persist`, key `finplan:strategy:v1`, `version: 1`.
- Actions: `addThesis`, `updateThesis`, `removeThesis`,
  `addScenario(thesisId, scenario)`, `updateScenario(thesisId, scenarioId, patch)`,
  `removeScenario(thesisId, scenarioId)`,
  `addRisk(thesisId, risk)`, `updateRisk(thesisId, riskId, patch)`,
  `removeRisk(thesisId, riskId)`,
  `replaceAll(data)`, `reset()`.
- Persisted slice holds only `theses: Thesis[]`.
- IDs via `crypto.randomUUID()`.
- Export schema version constant: `STRATEGY_EXPORT_SCHEMA_VERSION = 1`.
- `parseStrategyToolState(value: unknown): StrategyToolPersisted` sanitizer
  for imports (validates all fields, rejects bad data).

## 5. UI layout

Single page, mobile-first, max-w ~6xl, stacked sections:

1. **Toolbar** — SeedDemoButton, ExportImportButtons, ExportMarkdownButton,
   reset.
2. **Summary stats** — 4 StatCards: total theses, active theses, average
   weighted return, total high risks.
3. **Add thesis button** — opens inline form or modal to create a new thesis.
4. **Kanban board** — three columns: "Idea", "Active", "Closed". Each column
   contains thesis cards.
5. **Thesis card** — shows title, asset class badge, scenario summary
   (bull/base/bear return + probability), risk count with high-risk
   indicator, status badge. Click to expand/edit.
6. **Thesis detail panel** — expanded view or modal showing full thesis text,
   scenario editor (add/edit/remove scenarios), risk editor (add/edit/remove
   risks), notes, status change buttons, delete button.
7. **Empty state** — when no theses exist, show a message with CTA to add
   first thesis or seed demo data.

Hydration: persisted store hydrates after mount; the tool renders a skeleton
until `mounted` to avoid SSR mismatch.

Validation: thesis title required; scenario probability 0–1; expectedReturn
any finite number; timeHorizonMonths >= 1; risk name required; risk level
must be low/medium/high.

## 6. Demo seed — `src/lib/demo/strategy.ts`

Returns a complete `StrategyToolPersisted` with:
- 4 theses across different statuses and asset classes:
  1. "AI Infrastructure Play" (active) — equity, 3 scenarios, 3 risks
  2. "Emerging Market Bonds" (idea) — fixed income, 3 scenarios, 2 risks
  3. "Solar Energy ETF" (active) — equity/thematic, 3 scenarios, 2 risks
  4. "Cash Position Review" (closed) — cash, 2 scenarios, 1 risk
- Realistic return expectations, probabilities, risk levels.

## 7. Export / import

JSON: envelope via `createExportEnvelope("strategy", 1, data)`; filename
`finplan-strategy-YYYY-MM-DD.json`. Import validates
`readExportEnvelope(value, "strategy")` + `schemaVersion === 1`,
sanitizes fields, replaces state wholesale. Invalid imports raise the
shared import error.

Markdown: `exportBoardAsMarkdown()` produces a formatted markdown string.
Filename `finplan-strategy-YYYY-MM-DD.md`. Downloaded via a blob URL
similar to `downloadJson` but with `text/markdown` MIME type.

## 8. i18n

All strings under top-level `"strategy"` namespace in `en.json` / `th.json`.
Hyphenated key name matches the tool slug. Reuses `shared.*` keys for
seed/export/import buttons.

## 9. Tests

- Finance math: `weightedExpectedReturn` with multiple scenarios, single
  scenario, empty scenarios; `highestRiskLevel` with all levels, empty risks;
  `summarizeThesis` end-to-end; `summarizeAllTheses` sorting; `exportBoardAsMarkdown`
  structure and content.
- Store: initial state, CRUD for theses/scenarios/risks, replaceAll/reset,
  persistence.
- Seed: valid against `summarizeAllTheses`, realistic shapes, all theses
  have at least one scenario.

## 10. Out of scope

Real-time price feeds, portfolio correlation analysis, backtesting,
multi-user collaboration, chart visualizations beyond the kanban layout,
integration with other tools (DCA, retirement).
