# Spec — DCA fee comparator (`/dca`)

Phase 9 · MASTER-PLAN section 6 row 9. Compares how fund fees compound
against long-term DCA (dollar-cost averaging) investing, with a breakeven
horizon calculation as the key improvement.

## 1. Purpose

Let a user set up two or more fund options with different fee structures
and see how fees compound over a long investment horizon:

1. Growth comparison chart — same DCA contribution projected over N years,
   one line per fund, showing how net-of-fee balances diverge.
2. Cumulative fee chart — how much each fund has taken in fees over time.
3. Summary stats — ending balance, total invested, total fees, fee drag %.
4. Breakeven horizon — when a lower-fee / lower-return fund overtakes a
   higher-fee / higher-return fund.
5. Fee drag breakdown — what percentage of the gross return was lost to fees.

## 2. Data model

Money is plain major-unit numbers; rates are decimal fractions; months are
integers.

```ts
interface DcaFundInput {
  id: string;              // crypto.randomUUID()
  name: string;            // user label, e.g. "Index Fund A"
  expenseRatio: number;    // annual, decimal fraction, e.g. 0.007 = 0.7%
  frontLoad: number;       // sales load on each contribution, e.g. 0.05 = 5%
  exitLoad: number;        // redemption fee at the end, e.g. 0.01 = 1%
  annualReturn: number;    // gross annual return (before fees), e.g. 0.08 = 8%
}

interface DcaConfig {
  funds: DcaFundInput[];          // 2+ funds to compare
  monthlyContribution: number;    // monthly DCA amount, > 0
  horizonMonths: number;          // projection length, 1–600 (1–50 years)
  currency: string;               // ISO 4217
}
```

Persisted state:

```ts
interface DcaToolPersisted {
  funds: DcaFundInput[];
  monthlyContribution: number;
  horizonMonths: number;
  currency: string;
}
```

Derived values (schedules, comparison, breakeven) are recomputed on render
and never persisted.

## 3. Store — `src/lib/storage/dca-store.ts`

- Zustand + `persist`, key `finplan:dca:v1`, `version: 1`.
- Actions: `setFunds(funds)`, `addFund(fund)`, `updateFund(id, patch)`,
  `removeFund(id)`, `setMonthlyContribution(n)`, `setHorizonMonths(n)`,
  `setCurrency(c)`, `replaceState(snapshot)`, `reset()`.
- Persisted slice holds only the data above — no functions/Dates/Maps.

## 4. Math usage — `src/lib/finance/dca.ts`

### Core model

Each month during the DCA period:
1. Monthly contribution is invested after front-end load:
   `invested = monthlyContribution × (1 − frontLoad)`
2. Net monthly growth rate accounts for the expense ratio compounding:
   `netAnnual = (1 + grossReturn) × (1 − expenseRatio) − 1`
   `netMonthly = netAnnual / 12` (simple division for DCA simplicity)
3. Each month: `balance = balance × (1 + netMonthly) + invested`
4. At the end of the horizon, exit load is applied:
   `endingBalance = balance × (1 − exitLoad)`

### Functions

- `computeDcaSchedule(fund, monthlyContribution, horizonMonths)`:
  Returns `DcaPoint[]` — month-by-month balance and cumulative fees.
- `compareDcaFunds(funds, monthlyContribution, horizonMonths)`:
  Returns `DcaComparisonResult` — schedules for all funds, total fees,
  ending balances, fee drag.
- `computeBreakevenHorizon(fundA, fundB, monthlyContribution, maxMonths)`:
  Returns month number where fundB overtakes fundA (or null if never).
- `computeTotalFees(fund, monthlyContribution, horizonMonths)`:
  Returns total dollar amount paid in fees.

### Interfaces

```ts
interface DcaPoint {
  month: number;
  balance: number;          // net-of-fee balance
  totalFees: number;        // cumulative fees paid to date
}

interface DcaFundResult {
  fund: DcaFundInput;
  schedule: DcaPoint[];
  endingBalance: number;
  totalInvested: number;
  totalFees: number;
  grossEndingBalance: number;  // what it would be with zero fees
  feeDragPercent: number;      // (1 - net/gross) × 100
}

interface DcaComparisonResult {
  funds: DcaFundResult[];
  bestFundIndex: number;       // highest ending balance
  breakevenMonth: number | null; // month where order changes (2-fund only)
}
```

## 5. UI layout

Single page, mobile-first, max-w ~5xl, stacked sections:

1. **Toolbar** — currency select, SeedDemoButton, ExportImportButtons, reset.
2. **Investment params card** — monthly contribution (MoneyInput), horizon
   in months or years with a slider/input combo.
3. **Fund input cards** — one card per fund (min 2, max 4). Each card:
   name, expense ratio (%), front load (%), exit load (%), annual return (%).
   Inline validation: name required, rates ≥ 0, return < 1.
4. **Summary stats** — grid of StatCards showing per-fund ending balance,
   total fees, fee drag %, and best performer badge.
5. **Growth comparison chart** — Recharts line chart, X = month, one line
   per fund. Dashed line for gross (no-fee) projection. Tooltip shows all
   fund balances at that month.
6. **Cumulative fee chart** — Recharts area chart, stacked or overlaid,
   showing how much each fund charged over time.
7. **Breakeven horizon card** — when two funds cross. Visual indicator
   (vertical line on chart or stat card). Null state when funds never
   cross or only one fund is entered.

Hydration: persisted store hydrates after mount; the tool renders a skeleton
until `mounted` to avoid SSR mismatch.

## 6. Demo seed — `src/lib/demo/dca.ts`

Returns a complete `DcaToolPersisted` with two funds:
- "Low-cost index": 0.03% expense ratio, 0% load, 8% return
- "Active managed fund": 1.5% expense ratio, 5% front load, 0% exit, 9.5% return
- Monthly contribution: $500, horizon: 360 months (30 years), USD

## 7. Export / import

Envelope via `createExportEnvelope("dca", 1, snapshot)`; filename
`finplan-dca-YYYY-MM-DD.json`. Import validates `readExportEnvelope(value,
"dca")` + `schemaVersion === 1`, sanitizes fields, then replaces state
wholesale. Invalid imports raise the shared import error.

## 8. i18n

All strings under top-level `"dca"` namespace in `en.json` / `th.json`
(keys kept in sync). No hardcoded copy. Reuses `shared.*` keys for
seed/export/import buttons.

## 9. Tests

- Finance: `dca.ts` unit tests — single-fund schedule correctness,
  comparison with two funds, breakeven detection, zero-fee baseline,
  front-load impact, exit-load impact, edge cases (0 months, 0 return).
- Store: initial state, setFunds/addFund/updateFund/removeFund, replaceState
  round-trip, reset, clamp validations.
- Seed: valid against `computeDcaSchedule`, positive balances, realistic
  values.
- UI smoke: empty state renders; after seeding, summary + charts render.

## 10. Out of scope

Tax-advantaged accounts (401k/IRA), inflation adjustment, dividend
reinvestment modeling, multiple currency hedging, portfolio optimization.
