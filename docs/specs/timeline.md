# Spec — Life goals timeline (`/timeline`)

Phase 7 · MASTER-PLAN section 6 row 7. Composes existing
`src/lib/finance/compound.ts` primitives (`projectBalance`, `growthSchedule`,
`futureValue`, `presentValue`) plus a new dedicated
`src/lib/finance/timeline.ts` for timeline-specific pure math (overlap
detection, combined cash-flow projections, conflict scoring).

## 1. Purpose

Answer: **Do my life goals (buying a house, having kids, retiring) fit within
my savings capacity?** Show all goals on a single shared timeline, visualize
cash overlap, and detect when goals compete for the same money — the key
improvement over the original.

## 2. Data model

Money in major units; rates are decimal fractions; ages are integers;
months are integer offsets from "today" (age = current age, month 0).

```ts
type GoalCategory = "house" | "kids" | "retirement" | "education" | "custom";

interface Goal {
  id: string;                      // crypto.randomUUID()
  name: string;                    // free text
  category: GoalCategory;
  startAge: number;                // age when goal begins (0..MAX_AGE)
  endAge: number;                  // age when goal ends / is reached (0..MAX_AGE)
  totalCost: number;               // total cost in today's money (>= 0)
  monthlySavings: number;          // amount directed here per month (>= 0)
  annualReturnRate: number;        // return on savings for this goal (0..0.5)
  inflationRate: number;           // expected inflation for this goal (0..0.5)
}

interface TimelineSnapshot {
  currentAge: number;              // 0..MAX_AGE
  monthlyBudget: number;           // total monthly savings budget across all goals (>= 0)
  annualReturnRate: number;        // default return for new goals (0..0.5)
  inflationRate: number;           // default inflation (0..0.5)
  goals: Goal[];
  currency: string;                // ISO 4217, default "USD"
}
```

Derived values are recomputed on render and never persisted.

## 3. Math — `src/lib/finance/timeline.ts`

Pure functions, no React, fully unit-tested.

### 3.1. `goalNominalCost(goal, inflationRate)`

Inflate `totalCost` from today's money to the goal's end age using
`futureValue(cost, inflation, years)`, where `years = endAge − currentAge`.

### 3.2. `goalProjectedSavings(goal, currentAge)`

Use `projectBalance({ initialBalance: 0, monthlyContribution: monthlySavings,
annualRate: annualReturnRate, months: (endAge − currentAge) × 12 })` to find
how much the goal's dedicated savings grow to.

### 3.3. `goalShortfall(projected, nominalCost)`

Simple `nominalCost − projected`, clamped ≥ 0.

### 3.4. `detectConflicts(goals, monthlyBudget)`

Scan every pair of goals. Two goals "conflict" when their age ranges overlap
AND the sum of their `monthlySavings` exceeds the total `monthlyBudget`
during the overlap period. Returns `Conflict[]`:

```ts
interface Conflict {
  goalA: string;     // goal id
  goalB: string;     // goal id
  overlapStart: number;  // age
  overlapEnd: number;    // age
  monthlyDemand: number; // sum of both goals' monthlySavings during overlap
  gap: number;           // monthlyDemand − monthlyBudget (positive = over budget)
}
```

### 3.5. `combinedCashFlow(snapshot)`

For each month from `currentAge` to `max(endAge of all goals)`, compute:
- Total monthly savings directed (sum of `monthlySavings` for active goals)
- Net surplus/deficit = `monthlyBudget − totalMonthlyDirected`
- Running balance = prior balance + surplus

Returns `{ months: number[], budgetLine: number[], demandLine: number[],
balanceLine: number[] }` suitable for a Recharts AreaChart.

### 3.6. `totalMonthlyDemand(goals, age)`

Sum `monthlySavings` for every goal where `startAge ≤ age < endAge`.

### 3.7. Edge cases

- Zero goals → empty arrays / zero conflicts.
- `endAge ≤ startAge` → treat goal as zero-duration (point event).
- `monthlyBudget = 0` → all goals show as over-budget.
- All assertions throw `RangeError` on negative / out-of-range inputs;
  callers clamp in the store.

## 4. Store — `src/lib/storage/timeline-store.ts`

- Zustand + `persist`, key `finplan:timeline:v1`, `version 1`.
- Defaults: age 30, $1500/mo budget, 7% return, 3% inflation, three demo goals
  (house age 32–35, kids age 33–36 overlap, retirement age 30–60), USD.
- Actions: `addGoal`, `updateGoal(id, patch)`, `removeGoal(id)`,
  `setCurrentAge`, `setMonthlyBudget`, `setAnnualReturnRate`,
  `setInflationRate`, `setCurrency`, `replaceState(snapshot)`, `reset()`.
- `sanitizeTimelineSnapshot` clamps all numbers into safe ranges, normalizes
  currency, ensures goal IDs are strings.

## 5. UI layout

Single page, mobile-first, max-w ~6xl:

1. **Toolbar** — currency select, SeedDemoButton, ExportImportButtons, reset.
2. **Profile card** — current age, monthly budget, default return %,
   default inflation %. Inline validation: age 0–120, rates 0–50%.
3. **Goals list** — each goal shows name, category badge, start–end age,
   monthly savings amount, projected savings vs cost (shortfall badge).
   Add / edit / remove actions. Inline form: name, category select,
   start age, end age, total cost, monthly savings, return %, inflation %.
4. **Conflict alerts** — red warning banners when `detectConflicts` returns
   results. Each banner names the two goals, the overlap period, and how
   much over budget.
5. **Gantt chart** — horizontal bars (Recharts ComposedChart or custom SVG)
   showing each goal's duration on an age axis, color-coded by category.
   Overlapping regions highlighted.
6. **Cash-flow chart** — Recharts AreaChart with budget line, demand line,
   and net balance line over the age range. Red shading where demand > budget.
7. **Summary stats** — total goals count, total monthly demand, budget
   utilization %, goals with shortfall count.

Hydration: skeleton until mounted (persist hydration), same convention as
retirement/debt.

## 6. Demo seed — `src/lib/demo/timeline.ts`

Persona: age 30, $1,500/mo budget, 7% return, 3% inflation, USD.
Three goals:
- **House deposit** (house): age 32–35, $45,000 cost, $500/mo savings, 4% return
- **Kids education** (kids): age 33–36, $25,000 cost, $400/mo savings, 3% return
- **Retirement** (retirement): age 30–60, $600,000 cost, $600/mo savings, 7% return

The house and kids goals overlap at ages 33–35, and together ($900/mo) plus
retirement ($600/mo) = $1,500 = budget, so there is a visible but tight
allocation with no slack — a realistic scenario.

## 7. Export / import

Envelope via `createExportEnvelope("timeline", 1, snapshot)`; filename
`finplan-timeline-YYYY-MM-DD.json`. Import validates
`readExportEnvelope(value, "timeline")` + schema version, sanitizes, then
replaces state wholesale.

## 8. i18n

All strings under top-level `"timeline"` namespace in `en.json` / `th.json`
(keys synced; covered by messages test). Reuses `shared.*` for seed/export/
import buttons. No hardcoded copy.

## 9. Tests

- **Finance math**: `goalNominalCost` (inflation check), `goalProjectedSavings`
  (matches `projectBalance` directly), `goalShortfall`, `detectConflicts`
  (pairwise overlap, budget excess, no-conflict case), `combinedCashFlow`
  (sum correctness, surplus/deficit periods), `totalMonthlyDemand`.
- **Store**: defaults, add/update/remove goals, setters/clamps,
  replaceState/reset round-trip, persistence key/version.
- **Seed**: valid shape, produces at least one conflict or near-conflict.
- **UI smoke**: renders stats/goals list/charts after seed; empty state with
  no goals; add-goal form visible.

## 10. Out of scope

Multi-scenario comparison (bear/base/bull), integration with retirement
tool's projection, tax-adjusted returns, Monte Carlo, goal dependency
ordering (must buy house before kids school).
