# Spec — Subscriptions tracker (`/pay`)

Phase 8 · MASTER-PLAN section 6 row 8. Tracks recurring monthly/annual
subscriptions, computes totals, displays a renewal calendar, and records
price-increase history. No new finance math is needed — pure presentation
over stored data.

## 1. Purpose

Let a user list every recurring subscription they pay for, see total monthly
and annual cost, browse upcoming renewals on a calendar view, and track
historical price increases so they can spot creep. Everything runs client-side.

## 2. Data model

Money is plain major-unit numbers; dates are ISO `YYYY-MM` strings;
frequencies are string literals.

```ts
type BillingCycle = "monthly" | "yearly";

interface PriceRecord {
  amount: number;        // > 0
  effectiveMonth: string; // "YYYY-MM" — month this price took effect
}

interface Subscription {
  id: string;             // crypto.randomUUID()
  name: string;           // user label, e.g. "Netflix"
  amount: number;         // current price per cycle, > 0
  cycle: BillingCycle;    // "monthly" | "yearly"
  category: string;       // freeform tag, e.g. "streaming", "software"
  startDate: string;      // "YYYY-MM" — when subscription started
  renewalDay: number;     // 1-28, day of month it renews (or charges annually)
  currency: string;       // ISO 4217, shared across all subs
  priceHistory: PriceRecord[]; // chronological price changes (always >= 1 entry)
  active: boolean;        // false = cancelled/inactive
}

interface PaySnapshot {
  subscriptions: Subscription[];
  currency: string;
}
```

Derived values (monthly/annual totals, next renewals) are recomputed on render
and never persisted.

## 3. Store — `src/lib/storage/pay-store.ts`

- Zustand + `persist`, key `finplan:pay:v1`, `version: 1`.
- Actions:
  - `addSubscription(input)` → creates sub with auto-generated id
  - `updateSubscription(id, patch)` → partial update
  - `removeSubscription(id)` → delete
  - `setCurrency(currency)` → shared currency for all subs
  - `recordPriceIncrease(id, newAmount, effectiveMonth)` → pushes a new
    `PriceRecord` to `priceHistory` and updates `amount`
  - `replaceState(snapshot)` → used by demo seed + import
  - `reset()` → clears all data

Persisted slice holds only the data above — no functions/Dates/Maps.

## 4. Math usage

No `lib/finance` functions needed. All computations are simple aggregation:

- **Effective monthly cost**: `monthly = sum(amount for monthly) + sum(amount / 12 for yearly)`
- **Effective annual cost**: `annual = monthly * 12`
- **Upcoming renewals**: filter active subs, compute next renewal month from
  `renewalDay` + current month, sort ascending
- **Price increase summary**: for each sub with `priceHistory.length > 1`,
  compute delta from first to last price, and percentage change

## 5. UI layout

Single page, mobile-first, max-w ~6xl, stacked sections:

1. **Toolbar** — currency select, SeedDemoButton, ExportImportButtons, reset.
2. **Summary stats** — monthly cost, annual cost, active count, average per
   sub.
3. **Subscriptions editor** — table/card list of subscriptions. Each row
   shows name, category badge, current amount, cycle, renewal day. Inline
   edit/delete. Add form at bottom. Empty state when no subs. Cancelled subs
   shown with strikethrough, hidden from totals but kept for price history.
4. **Upcoming renewals** — next 3 months grid (calendar-like), each month
   shows which subs renew and how much. Color-coded by category.
5. **Cost breakdown chart** — Recharts PieChart of monthly cost by category
   (streaming, software, utilities, etc.).
6. **Price increase tracker** — table of subs that have had price increases,
   showing: name, original price, current price, total increase, % change,
   and the month each increase happened. Sorted by largest increase first.

Hydration: persisted store hydrates after mount; the tool renders a skeleton
until `mounted` to avoid SSR mismatch.

Validation: add/edit form requires non-empty name, `amount > 0`, valid
`renewalDay` (1-28), and valid date strings. Invalid submits are blocked at
the button.

## 6. Demo seed — `src/lib/demo/pay.ts`

Returns a complete `PaySnapshot` with ~6 realistic subscriptions:
- Netflix (monthly, streaming)
- Spotify (monthly, music)
- iCloud+ (monthly, cloud)
- GitHub Pro (monthly, software)
- gym membership (monthly, fitness)
- Amazon Prime (yearly, shopping)

Each with 1-2 price history entries showing realistic increases. Currency USD.

## 7. Export / import

Envelope via `createExportEnvelope("pay", 1, snapshot)`; filename
`finplan-pay-YYYY-MM-DD.json`. Import validates `readExportEnvelope(value,
"pay")` + `schemaVersion === 1`, sanitizes fields, then replaces state
wholesale. Invalid imports raise the shared import error.

## 8. i18n

All strings under top-level `"pay"` namespace in `en.json` / `th.json` (keys
kept in sync; covered by existing messages test). No hardcoded copy. Reuses
`shared.*` keys for seed/export/import buttons.

## 9. Tests

- Store: initial state, CRUD actions, recordPriceIncrease, replaceState/reset
  round-trip, persistence under jsdom localStorage.
- Seed: valid snapshot shape, all subscriptions have positive amounts and
  valid cycles, price history is non-empty.
- UI smoke (testing-library): empty state renders; after seeding, summary
  stats + subscription list render.

## 10. Out of scope

Cancel reminder notifications, bank integration, auto-categorization, shared
family subscriptions, trial period tracking.
