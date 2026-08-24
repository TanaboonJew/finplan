# Spec — Yearly budget (`/budget`)

Master Plan row 2. Status: implemented in this phase.

## What it does

A local-first yearly budget planner: you define spending/saving categories,
plan an amount per month for each, then record what you actually spent.
A categories × 12 months grid shows planned vs actual side by side, a
health score summarizes how well actuals track plans, and — the improvement
over the original — a per-category **rollover** option carries unused budget
forward into later months instead of letting it expire.

MVP scope (Master Plan): categories × 12 months grid, planned vs actual,
health score.
Improvement: rollover of unused budget (per category, off by default).

## Non-goals

- No income tracking — income streams belong to `/flow` (cash flow planner).
- No transaction ledger / statement import — `/statement` covers that; here
  one row = "what I spent on this category this month".
- No interest/growth modeling and no multi-year roll-forward; the tool
  manages exactly one calendar year at a time.
- No recurring-rule engine; monthly plans are edited directly in the grid.

## Data model (persisted slice)

Stored by `src/lib/storage/budget-store.ts` under localStorage key
`finplan:budget:v1`, `version: 1`. Plain JSON only.

```ts
type CategoryKind = "expense" | "savings";

interface BudgetCategory {
  id: string;               // crypto.randomUUID()
  name: string;             // user-editable label, i18n-agnostic
  kind: CategoryKind;       // expense rows spend money, savings rows set it aside
  rolloverEnabled: boolean; // improvement: carry unused budget forward
  plans: number[];          // length 12, planned amount per month (>= 0)
}

interface BudgetEntry {
  id: string;
  categoryId: string;
  month: number;            // 0–11 (January = 0)
  amount: number;           // > 0
  date: string;             // ISO YYYY-MM-DD, when it was recorded
  note: string;             // optional free text
}

interface BudgetToolPersisted {
  year: number;             // e.g. 2026 — label only; months stay 0–11
  categories: BudgetCategory[];
  entries: BudgetEntry[];
}
```

Key decisions:

- **Actuals are entries, not a parallel grid.** Recording spending appends an
  entry; the per-month totals shown in the grid are always derived. This keeps
  exports small and lets notes/dates survive without duplicating state.
- **`plans` is a fixed-length array of 12 numbers** (not a sparse map) so grid
  rendering and math never fight with missing keys. Missing/short arrays are
  rejected on import.
- Deleting a category **cascades**: its entries are removed too (they have no
  meaning without their row). The UI asks for confirmation first; the store
  performs the cascade deterministically as defense in depth.
- Derived values (monthly totals, availability with rollover, health score,
  chart series) are never persisted — recomputed via `lib/finance/budget`.

## Pure math (`src/lib/finance/budget.ts`, Vitest-covered)

All functions are pure, React-free, and throw `RangeError`/`TypeError`
(via `lib/finance/validation`) on invalid input.

- `foldEntriesToMonths(entries)` → `Map<categoryId, number[]>` — folds entry
  amounts into a 12-slot array per category. Rejects months outside 0–11 and
  non-finite/negative amounts.
- `applyRollover(planned, actual)` → `number[]` (length 12) — available budget
  per month. With rollover:
  `available[m] = available[m−1] + planned[m] − actual[m]`; without:
  `available[m] = planned[m] − actual[m]`. Negative values are preserved so
  overspending is visible (UI renders them red).
- `summarizeCategory({ id, kind, rolloverEnabled, plans }, actualByMonth)` →
  `CategorySummary` with `planned[12]`, `actual[12]`, `available[12]`,
  `totalPlanned`, `totalActual`, `totalRemaining`. Validates plan shape.
- `aggregateSummaries(summaries)` → `{ planned[12], actual[12],
  available[12] }` — sums across categories for the stats band and chart.
  (Availability is summed only across rollover-enabled categories plus plain
  remainder semantics — see below.)
- `buildHealthCells(summaries)` → evaluated `{ planned, actual }[]` — a cell
  is judged iff it has recorded activity (`actual > 0`). Months after your
  last recorded activity say nothing about discipline, so they are ignored.
- `computeBudgetHealth(cells)` → `BudgetHealth`:
  - penalty per cell = `planned > 0 ? clamp((actual − planned)/planned, 0, 1) : 1`
    (unplanned spending scores zero for that cell; double-plan overspend
    saturates at zero).
  - `score = round(100 × (1 − mean(penalty)))`, or `null` when no cells were
    evaluated (nothing recorded yet).
  - `grade`: `"great"` ≥ 90, `"good"` ≥ 75, `"fair"` ≥ 60, else `"poor"`.
  - also returns `cellsEvaluated`, `cellsOverspent` (actual > planned + ε),
    `plannedTotal`, `actualTotal` over evaluated cells.

Rollover + aggregation note: summing per-category `available` across mixed
rollover settings would mix semantics, so `aggregateSummaries` computes the
aggregate `available` column from aggregate planned/actual with rollover
treated globally-off, while individual summaries keep their own setting. The
grid's per-row Available column is authoritative per category.

## UI

Single client page at `/[locale]/budget`; server wrapper provides metadata
(`tools.budget.*`) + `setRequestLocale` (Next async params). All strings via
the top-level `budget.*` namespace (`en`/`th`). Mobile-first, dark-mode safe,
tabular-nums everywhere. Persisted state renders only after mount (skeleton
during SSR), matching storage conventions.

Sections:

1. **Header + toolbar** — title/subtitle; shared `SeedDemoButton`,
   `ExportImportButtons` (envelope `tool: "budget"`, schemaVersion 1,
   filename `finplan-budget-YYYY-MM-DD.json`), year select, reset action.
2. **Stats band** — four `StatCard`s: total planned, total actual, remaining,
   health score (`score ?? "—"` with grade wording and "x of y recorded
   months within plan" sublabel; tone positive/default/negative by grade).
3. **Grid card** (the core) — horizontally scrollable table, sticky name
   column: per row, 12 compact numeric inputs for plans (commit on blur,
   clamped ≥ 0), derived actuals per month (red when over that month's
   available), row totals, a rollover toggle switch, and a delete button.
   Footer row aggregates each month. Legend chips explain colors; hint text
   explains rollover. Empty state with CTA when no categories exist.
4. **Add category form** — name field, kind select (expense / savings),
   add button; new rows start with all-zero plans.
5. **Chart card** — Recharts grouped bars: planned vs actual aggregated per
   month inside the shared `ChartCard`, custom tooltip, hidden in favor of an
   empty-state message until data exists.

Recording actuals lives where the money story starts — the grid's actual
cells are derived, so a compact "record spending" dialog per row would bloat
the table; instead each row header has a quick-add form (month select,
amount, optional note) revealed via an icon button. Entries are listed in a
collapsible per-row log with delete buttons. Hmm — per-row logs duplicate the
table heavily. Final call: **one global "Record spending" card** next to the
add-category form (category select, month select, amount, note) plus a
single recent-entries list under it. Keeps the grid read-mostly, matches how
people actually log expenses.

## Demo seed (`src/lib/demo/budget.ts`)

`createBudgetDemoState()` builds a full snapshot for the current calendar
year through the store's import path: seven categories (Groceries, Rent &
utilities, Transport, Fun money, Health, Emergency fund [savings, rollover],
Trip fund [savings, rollover]), mostly constant plans with light seasonal
variation, and hand-authored actuals for January through August mixing
on-plan, under, and over months so every UI state (green/red cells, rollover
growth, meaningful health score) is visible immediately.

## Validation

- Plan inputs accept only finite numbers ≥ 0; blur commits clamp/blank to 0.
- Entry form rejects non-positive/non-finite amounts and requires a known
  category; month comes from a select so it is always 0–11.
- Import rejects anything failing `readExportEnvelope(_, "budget")` or whose
  `data` fails structural guards (year integer, arrays present, category
  names non-empty, plans length-12 finite ≥ 0, kind ∈ {expense, savings},
  entries reference valid-shaped fields with ISO dates).

## Definition of Done mapping

- Route renders, responsive, light/dark correct → design-system tokens only.
- i18n → all copy under `budget.*` in `en.json` + `th.json` (key parity test).
- Persistence → zustand persist, survives reload.
- Math → `lib/finance/budget.ts` + `tests/finance/budget.test.ts`.
- Demo seed / export / import / empty states → toolbar + guards above.
- Lint/typecheck/test green before commit.
