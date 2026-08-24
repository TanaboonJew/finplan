# Spec — Debt payoff planner (`/debt`)

Phase 2 · MASTER-PLAN section 6 row 1. UI built on top of the existing
`src/lib/finance/payoff.ts` engine (Phase 1). No new finance math is introduced;
this tool composes `simulatePayoff` / `compareStrategies` with presentation.

## 1. Purpose

Let a user list every debt they owe, then compare **Snowball**, **Avalanche**
and **Hybrid** payoff plans side by side: month-by-month balance schedule,
total interest, months to debt-free, and projected calendar payoff dates.
An extra-payment simulator shows what every additional amount per month saves.

## 2. Data model

Money is plain major-unit numbers; rates are decimal fractions; months are
ISO `YYYY-MM` strings (storage conventions doc).

```ts
interface DebtInput {
  id: string;            // crypto.randomUUID()
  name: string;          // user label, e.g. "Visa card"
  balance: number;       // >= 0
  annualRate: number;    // decimal fraction, e.g. 0.2299
  minimumPayment: number; // >= 0
}

type DebtState = {
  debts: DebtInput[];
  strategy: PayoffStrategy;      // active plan for table/chart emphasis
  extraMonthlyPayment: number;   // >= 0
  currency: string;              // ISO 4217, default "USD"
  startMonth: string | null;     // "YYYY-MM" anchor for payoff dates; null = current month
};
```

Derived values (schedules, totals, dates) are recomputed on render and never
persisted.

## 3. Store — `src/lib/storage/debt-store.ts`

- Zustand + `persist`, key `finplan:debt:v1`, `version: 1`.
- Actions: `addDebt`, `updateDebt`, `removeDebt`, `setStrategy`,
  `setExtraMonthlyPayment`, `setCurrency`, `setStartMonth`,
  `replaceState(snapshot)` (used by demo seed + import), `reset()`.
- Persisted slice holds only the data above — no functions/Dates/Maps.

## 4. Math usage (existing engine only)

- `compareStrategies(debts, { extraMonthlyPayment })` → all three plans at once
  for cards + chart.
- Baseline comparison memo runs the same call with `extraMonthlyPayment: 0`
  to compute "months saved / interest saved" in the simulator.
- Engine failures (`RangeError`: minimums cannot cover interest, or maxMonths
  exhausted) are caught per-memo and surfaced as a friendly warning banner,
  never a crash.
- Per-debt payoff dates derive from `payoffMonthById` + `startMonth`
  (calendar math only, no money math).

## 5. UI layout

Single page, mobile-first, max-w ~6xl, stacked sections:

1. **Toolbar** — currency select, start-month picker (`<input type="month">`),
   SeedDemoButton, ExportImportButtons, reset.
2. **Summary stats** — total balance, sum of minimum payments, debt-free date
   for the selected strategy, interest saved vs minimums-only.
3. **Debts editor** — one row/card per debt (name, balance, APR %, minimum)
   editable inline, delete button; add-debt form at the bottom. Empty state
   with "Add your first debt" CTA when the list is empty.
4. **Strategy comparison** — three selectable cards (snowball / avalanche /
   hybrid): months to payoff, debt-free date, total interest, delta vs the
   cheapest plan. Selecting a card sets the active strategy.
5. **Balance chart** — Recharts line chart, one line per strategy, X = month,
   Y = remaining total balance; selected strategy line emphasized.
6. **Extra-payment simulator** — MoneyInput + range slider; shows months and
   interest saved versus paying exactly the minimums.
7. **Schedule table** — month-by-month rows (month #, calendar month, balance,
   interest, principal) for the selected strategy; rows where a debt is fully
   paid are flagged with its name. Scrollable container.

Hydration: persisted store hydrates after mount; the tool renders a skeleton
until `mounted` to avoid SSR mismatch (conventions rule 5).

Validation: add/edit form requires non-empty name, finite numbers,
`balance >= 0`, `0 <= rate <= 1`, `minimumPayment >= 0`; invalid submits are
blocked at the button. APR is entered as a percent at the UI edge and stored
as a fraction.

## 6. Demo seed — `src/lib/demo/debt.ts`

Returns a complete `DebtSnapshot`: four round-number debts (card, student
loan, auto loan, medical), avalanche-friendly rate spread, extra payment 150,
currency USD, start month = current month. Goes through `replaceState`.

## 7. Export / import

Envelope via `createExportEnvelope("debt", 1, snapshot)`; filename
`finplan-debt-YYYY-MM-DD.json`. Import validates `readExportEnvelope(value,
"debt")` + `schemaVersion === 1`, sanitizes fields (clamps/filters), then
replaces state wholesale. Invalid imports raise the shared import error.

## 8. i18n

All strings under top-level `"debt"` namespace in `en.json` / `th.json`
(keys kept in sync; covered by existing messages test). No hardcoded copy.
Reuses `shared.*` keys for seed/export/import buttons.

## 9. Tests

- Store: initial state, CRUD actions, replaceState/reset round-trip,
  persistence under jsdom localStorage.
- Seed: valid against `simulatePayoff` for every strategy, positive months,
  realistic shapes.
- UI smoke (testing-library): empty state renders; after seeding, summary +
  strategy cards render; engine-failure banner path via impossible debt.

## 10. Out of scope

Target-date solver, refinance modeling, statement import integration — later
phases/improvements.
