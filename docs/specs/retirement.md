# Spec — Retirement planner (`/retirement`)

Phase 3 · MASTER-PLAN section 6 row 3. Built on the existing
`src/lib/finance/compound.ts` engine (Phase 1) — no new finance-module files;
this tool composes `futureValue` / `presentValue` / `projectBalance` /
`growthSchedule` / `futureValueOfAnnuity` inside a pure helper that lives with
the tool (same pattern as the debt planner's `run-comparison.ts`).

## 1. Purpose

Answer three questions from a single profile: **How much do I need to retire
(FIRE number)? Where am I headed? What if returns/inflation differ?** The
improvement over the original is a deterministic scenario grid ("Monte
Carlo-lite"): bear/base/bull combinations of market return and inflation, each
with its own inflated FIRE target and deflated "today's money" balance.

## 2. Data model

Money in major units; rates are decimal fractions; ages are integers.

```ts
interface RetirementSnapshot {
  currentAge: number;              // 0..120
  retirementAge: number;           // 0..120 (validation hint when <= currentAge)
  currentSavings: number;          // >= 0
  monthlyContribution: number;     // >= 0
  annualReturnRate: number;        // decimal fraction, e.g. 0.07
  inflationRate: number;           // decimal fraction, e.g. 0.03
  desiredRetirementIncome: number; // annual, today's money
  withdrawalRate: number;          // decimal fraction, default 0.04 (4% rule)
  currency: string;                // ISO 4217, default "USD"
}
```

Derived values are recomputed on render and never persisted.

## 3. Math (composition only)

Let `years = max(0, retirementAge − currentAge)`, `months = years × 12`.

- **Annual expense at retirement (nominal)** — `futureValue(income, inflation, years)`.
- **FIRE number** — expense at retirement ÷ `withdrawalRate`.
- **Projected balance at retirement** — `projectBalance({ initialBalance,
  monthlyContribution, annualRate, months })`.
- **Today's-money value of the projection** — `presentValue(projected, inflation, years)`
  (annual deflation matches how the target was inflated).
- **Needed monthly contribution to hit FIRE by retirement age** —
  `(fireTarget − futureValue(savings, r/12, months)) ÷ futureValueOfAnnuity(1, r/12, months)`,
  clamped at ≥ 0; `null` when `years === 0` (already at retirement age).
- **Scenario grid** — bear `{ return −2pp, inflation +1pp }`, base `{ r, i }`,
  bull `{ return +2pp, inflation −1pp }`, all clamped to ≥ 0. Each scenario
  computes its own FIRE target and yearly balance path.
- **Yearly chart series** — sample `growthSchedule(...)` every 12 months,
  X = age.

Engine asserts (`RangeError`) never escape: inputs are clamped/sanitized in
the store and the helper clamps scenario rates before calling primitives.

## 4. Store — `src/lib/storage/retirement-store.ts`

- Zustand + `persist`, key `finplan:retirement:v1`, `version: 1`.
- Sensible defaults pre-filled (age 32 → 65, $40k saved, $800/mo, 7% return,
  3% inflation, $48k desired income, 4% withdrawal) so the page shows a live
  projection on first visit; `reset()` returns to them.
- Actions: one setter per field, `replaceState(snapshot)` (demo seed + import),
  `reset()`. Exported `sanitizeRetirementSnapshot` clamps numbers into range,
  normalizes currency, coerces ages to integers.

## 5. UI layout

Single page, mobile-first, max-w ~6xl:

1. **Toolbar** — currency select, SeedDemoButton, ExportImportButtons, reset.
2. **Inputs card** — current age, retirement age, current savings, monthly
   contribution, expected return %, inflation %, desired retirement income
   (annual, today's money), withdrawal rate %. Inline validation: retirement
   age must exceed current age; rates bounded (return/inflation 0–50%,
   withdrawal 0.5–20%). Invalid input blocks nothing destructive but flags
   the field and the stats recompute from sanitized values.
3. **Stat cards** — FIRE number (nominal at retirement); projected balance at
   retirement (+ today's-money sublabel); surplus/shortfall vs FIRE (tone
   colored, "FI by age N" sublabel); needed monthly contribution (sublabel:
   currently saving X/mo).
4. **Projection chart** — Recharts line chart, X = age, three scenario lines
   (bear/base/bull) + dashed reference line at the base FIRE target.
5. **Scenarios table** — per scenario: return, inflation, nominal balance at
   retirement, value in today's money, surplus/shortfall badge vs its own
   FIRE target.

Hydration: skeleton until mounted (persist hydration), same convention as
debt/jar.

## 6. Demo seed — `src/lib/demo/retirement.ts`

Persona: age 34 → 60, $38,500 saved, $950/mo, 6.8% return, 2.9% inflation,
$52,000 desired income, 4% withdrawal, USD — lands slightly short of FIRE so
the shortfall/needed-monthly paths render meaningfully.

## 7. Export / import

Envelope via `createExportEnvelope("retirement", 1, snapshot)`; filename
`finplan-retirement-YYYY-MM-DD.json`. Import validates
`readExportEnvelope(value, "retirement")` + schema version, sanitizes, then
replaces state wholesale.

## 8. i18n

All strings under top-level `"retirement"` namespace in `en.json` / `th.json`
(keys synced; covered by messages test). Reuses `shared.*` for seed/export/
import buttons. No hardcoded copy.

## 9. Tests

- Projection helper: FIRE number math, today's-money deflation, needed-monthly
  solution hits target, scenario ordering (bull > base > bear), zero-horizon
  and zero-rate edge cases.
- Store: defaults, setters/clamps, replaceState/reset round-trip, persistence
  key/version under jsdom localStorage.
- Seed: valid shape, produces a finite projection with a shortfall story.
- UI smoke: renders stats/chart/table after seed; validation hint on inverted
  ages.

## 10. Out of scope

Random-sampling Monte Carlo, drawdown/decumulation phase, social-security or
pension income, tax treatment of withdrawals, multi-profile comparison —
possible later improvements.
