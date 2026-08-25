# Spec — Loan explainer (`/loan`)

Phase 5 · MASTER-PLAN section 6 row 5. UI built on top of the existing
`src/lib/finance/amortization.ts` engine (Phase 1). A new `refinance.ts`
module provides break-even analysis for the refinance improvement.

## 1. Purpose

Let a user enter a single loan's parameters (principal, APR, term) and see:

1. Monthly payment calculated instantly.
2. Full amortization schedule — month-by-month principal, interest, balance.
3. **Principal vs interest split** visualized over the loan lifetime: stacked
   area chart showing how each payment divides, plus a running total of
   cumulative principal paid vs cumulative interest paid.
4. Summary stats: total interest paid, total cost, payoff date.
5. **Refinance break-even calculator**: enter a new loan's APR and any
   refinancing cost; the tool shows the monthly savings and how many months
   until the savings recoup the closing cost — the break-even horizon.

## 2. Data model

Money is plain major-unit numbers; rates are decimal fractions; months are
ISO `YYYY-MM` strings.

```ts
interface LoanInput {
  id: string;            // crypto.randomUUID()
  name: string;          // user label, e.g. "Mortgage"
  principal: number;     // > 0
  annualRate: number;    // decimal fraction, e.g. 0.065
  termMonths: number;    // > 0, integer
}

interface RefinanceInput {
  newAnnualRate: number;     // decimal fraction
  closingCost: number;       // one-time fee, >= 0
  newTermMonths: number;     // > 0, integer (same as original or different)
}
```

Persisted state:

```ts
interface LoanToolPersisted {
  loan: LoanInput | null;           // null = empty state
  refinance: RefinanceInput | null; // null = refinance panel collapsed
  currency: string;                 // ISO 4217
  startMonth: string | null;        // "YYYY-MM" anchor; null = current month
}
```

Derived values (schedule, summary, refinance analysis) are recomputed on
render and never persisted.

## 3. Store — `src/lib/storage/loan-store.ts`

- Zustand + `persist`, key `finplan:loan:v1`, `version: 1`.
- Actions: `setLoan`, `setRefinance`, `clearRefinance`, `setCurrency`,
  `setStartMonth`, `replaceState(snapshot)`, `reset()`.
- Persisted slice holds only the data above — no functions/Dates/Maps.

## 4. Math usage

### Existing engine (`amortization.ts`)

- `monthlyPayment(principal, annualRate, termMonths)` → monthly payment.
- `buildAmortizationSchedule({ principal, annualRate, termMonths })` →
  full `AmortizationRow[]` schedule.
- `summarizeSchedule(rows)` → total principal, total interest, total paid.

### New module (`refinance.ts`)

- `computeRefinanceBreakEven(currentLoan, newLoan)`:
  - Builds both amortization schedules.
  - Computes `monthlySaving = currentPayment − newPayment`.
  - If `monthlySaving <= 0`, returns `{ breakEvenMonths: null, ... }` —
    refinancing does not save money.
  - Otherwise `breakEvenMonths = Math.ceil(closingCost / monthlySaving)`.
  - Also returns: `newMonthlyPayment`, `currentMonthlyPayment`,
    `totalSavingsOverNewTerm`, `totalSavingsOverOldTerm` (min of new term
    and old remaining term).

## 5. UI layout

Single page, mobile-first, max-w ~5xl, stacked sections:

1. **Toolbar** — currency select, start-month picker (`<input type="month">`),
   SeedDemoButton, ExportImportButtons, reset.
2. **Loan inputs card** — name, principal (MoneyInput), APR (% input),
   term in months. Inline validation: name required, principal > 0,
   APR >= 0, termMonths > 0 integer.
3. **Summary stats** — 4 StatCards: monthly payment, total interest,
   total cost, payoff date.
4. **Principal vs interest chart** — Recharts stacked area chart.
   X = month number, Y = dollar amount. Two areas: principal portion and
   interest portion per payment. Color: emerald for principal, amber for
   interest.
5. **Cumulative chart** — Recharts line chart. X = month, two lines:
   cumulative principal paid, cumulative interest paid. Shows the crossover
   point where you've paid more principal than interest.
6. **Amortization table** — month-by-month rows (month #, payment,
   principal, interest, balance). Scrollable container, max-height ~400px.
7. **Refinance break-even card** — collapsible section. When expanded:
   new APR input (%), new term (months), closing cost (MoneyInput).
   Displays: monthly saving, break-even in months, total savings over loan
   life. Visual bar or stat cards. Warning if refinancing costs more than
   it saves.

Hydration: persisted store hydrates after mount; the tool renders a skeleton
until `mounted` to avoid SSR mismatch.

## 6. Demo seed — `src/lib/demo/loan.ts`

Returns a complete `LoanToolPersisted`: a $250,000 mortgage at 6.5% APR
over 30 years, USD, start month = current month. Refinance pre-filled
with 5.5% APR, 30-year term, $3,000 closing cost.

## 7. Export / import

Envelope via `createExportEnvelope("loan", 1, snapshot)`; filename
`finplan-loan-YYYY-MM-DD.json`. Import validates `readExportEnvelope(value,
"loan")` + `schemaVersion === 1`, sanitizes fields, then replaces state
wholesale. Invalid imports raise the shared import error.

## 8. i18n

All strings under top-level `"loan"` namespace in `en.json` / `th.json`
(keys kept in sync). No hardcoded copy. Reuses `shared.*` keys for
seed/export/import buttons.

## 9. Tests

- Finance: `refinance.ts` unit tests — break-even with positive savings,
  break-even when new rate is higher, break-even with zero closing cost,
  equal rates.
- Store: initial state, setLoan/setRefinance/clearRefinance, replaceState
  round-trip, reset.
- Seed: valid against `buildAmortizationSchedule` for both current and
  proposed loans, positive months, realistic values.
- UI smoke: empty state renders; after seeding, summary + chart + table
  render.

## 10. Out of scope

Multiple-loan comparison, adjustable-rate mortgages, balloon payments,
loan consolidation analysis — future phases if desired.
