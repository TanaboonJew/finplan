# Spec — Cash flow planner (`/flow`)

Phase 10 · MASTER-PLAN section 6 row 10. Income/expense streams visualized
monthly with what-if sliders that recompute live as the improvement.

## 1. Purpose

Let a user define recurring income streams (salary, freelance, etc.) and
recurring expense streams (rent, groceries, subscriptions, etc.), then see
a month-by-month visualization of net cash flow and cumulative balance.
**What-if sliders** let the user scale individual stream amounts up or down
and instantly see how the projection changes — the core improvement over the
original tool.

## 2. Data model

Money is plain major-unit numbers; rates are decimal fractions; months are
ISO `YYYY-MM` strings.

```ts
type StreamCategory =
  | "income"
  | "expense";

interface FlowStream {
  id: string;            // crypto.randomUUID()
  name: string;          // user label, e.g. "Salary"
  amount: number;        // monthly amount, >= 0
  category: StreamCategory;
  startMonth: string;    // "YYYY-MM", first month this stream is active
  endMonth: string | null; // "YYYY-MM" last active month, null = open-ended
}

interface FlowSnapshot {
  streams: FlowStream[];
  startingBalance: number;  // >= 0
  horizonMonths: number;    // 1–120, default 12
  currency: string;         // ISO 4217, default "USD"
}

interface WhatIfAdjustment {
  streamId: string;         // must match a stream id
  scale: number;            // multiplier, default 1.0 (e.g. 1.1 = +10%)
}
```

Derived values (monthly totals, cumulative balance, chart data) are
recomputed on render and never persisted.

## 3. Store — `src/lib/storage/flow-store.ts`

- Zustand + `persist`, key `finplan:flow:v1`, `version: 1`.
- Actions: `addStream`, `updateStream`, `removeStream`,
  `setStartingBalance`, `setHorizonMonths`, `setCurrency`,
  `setWhatIfAdjustments(adjustments[])`, `resetWhatIf()`,
  `replaceState(snapshot)` (used by demo seed + import), `reset()`.
- The `whatIfAdjustments` array is persisted alongside the base snapshot
  so the user's what-if state survives reload.
- Persisted slice holds only the data above — no functions/Dates/Maps.

## 4. Math — `src/lib/finance/flow.ts`

Pure functions, no React dependency. Fully unit-tested.

```ts
interface MonthlyPoint {
  month: string;          // "YYYY-MM"
  totalIncome: number;
  totalExpense: number;
  netFlow: number;        // income − expense
  balance: number;        // running balance
}

function projectCashFlow(
  streams: FlowStream[],
  startingBalance: number,
  horizonMonths: number,
  startMonth: string,     // "YYYY-MM" anchor
  adjustments?: WhatIfAdjustment[],
): MonthlyPoint[];
```

Logic per month: sum active streams' amounts (applying any scale adjustment),
subtract expenses from income to get net flow, add to running balance. No
interest or compounding — this is a cash flow projection, not an investment
model. If the user wants investment projections, the retirement tool exists.

Reuses `aprToMonthlyRate` from `rates.ts` only if a future enhancement adds
interest on the balance; the MVP keeps it simple.

## 5. UI layout

Single page, mobile-first, max-w ~6xl, stacked sections:

1. **Toolbar** — currency select, horizon slider (1–120 months),
   SeedDemoButton, ExportImportButtons, reset.
2. **Summary stats** — total monthly income, total monthly expenses,
   net cash flow, projected ending balance, months of runway (balance / net
   burn if negative).
3. **Stream editor** — two sub-sections (Income / Expenses), each listing
   streams with inline-editable name + amount + date range. Add form at
   bottom of each section. Empty states per section.
4. **What-if sliders** — each stream gets a scale slider (50%–200%, default
   100%). Changing a slider immediately recomputes the charts. A "Reset
   what-if" button restores all to 100%.
5. **Monthly chart** — Recharts BarChart, X = month, stacked bars for income
   (green) and expenses (red), with a net-flow line overlay.
6. **Cumulative balance chart** — Recharts AreaChart, X = month, Y = running
   balance. Positive area green, negative area red.
7. **Monthly detail table** — month, income, expense, net, balance rows;
   scrollable container.

Hydration: persisted store hydrates after mount; the tool renders a skeleton
until `mounted` to avoid SSR mismatch.

Validation: name must be non-empty, amount >= 0, startMonth valid
YYYY-MM, endMonth null or >= startMonth, horizonMonths 1–120.

## 6. Demo seed — `src/lib/demo/flow.ts`

Returns a complete `FlowSnapshot`: salary, freelance side income, rent,
groceries, utilities, transport, and a couple of subscriptions. Realistic
amounts, currency USD, horizon 12 months, starting balance $5,000.
All IDs are `demo-*` prefixed.

## 7. Export / import

Envelope via `createExportEnvelope("flow", 1, snapshot)`; filename
`finplan-flow-YYYY-MM-DD.json`. Import validates
`readExportEnvelope(value, "flow")` + `schemaVersion === 1`, sanitizes
fields, replaces state wholesale. What-if adjustments are NOT included in
export (they are scenario-only).

## 8. i18n

All strings under top-level `"flow"` namespace in `en.json` / `th.json`.
No hardcoded copy. Reuses `shared.*` keys for seed/export/import buttons.

## 9. Tests

- **Finance**: `projectCashFlow` with zero streams, single stream, multiple
  streams, streams with end dates, negative net flow, empty horizon.
- **Store**: initial state, CRUD, replaceState/reset round-trip,
  persistence.
- **Seed**: valid snapshot shape, realistic values.

## 10. Out of scope

Interest accrual on balance, variable-rate streams, multi-currency
conversion, bank statement import integration — later phases.
