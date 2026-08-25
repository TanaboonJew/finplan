# Spec — Travel card comparator (`/travel-card`)

Phase 12 · MASTER-PLAN section 6 row 12. Compares FX fees, rewards
abroad, and VAT refund eligibility across travel/credit cards, with a
trip cost simulator as the key improvement.

## 1. Purpose

Let a user set up multiple travel/credit cards and compare their true
cost for a specific overseas trip:

1. Per-card breakdown — FX fees, exchange-rate markup, foreign-spending
   rewards, ATM withdrawal fees, and annual fee prorated to the trip.
2. VAT refund estimation — country-specific VAT rate and minimum spend
   threshold, applied to eligible spending.
3. Trip cost simulator — adjust trip spending and instantly see which
   card wins, with per-card total cost, net savings vs worst card, and
   a breakdown chart.
4. Stats — best card badge, total savings, per-card cost comparison.

## 2. Data model

Money is plain major-unit numbers; rates are decimal fractions; days
are positive integers.

```ts
interface TravelCardInput {
  id: string;              // crypto.randomUUID()
  name: string;            // user label, e.g. "Wise card"
  annualFee: number;       // flat annual fee in home currency
  fxFeePercent: number;    // e.g. 0.02 = 2% per foreign transaction
  fxMarkupPercent: number; // e.g. 0.01 = 1% hidden in exchange rate
  rewardForeignPercent: number; // e.g. 0.03 = 3% cashback abroad
  rewardDomesticPercent: number;// e.g. 0.01 = 1% cashback at home
  atmFeeFlat: number;      // flat fee per ATM withdrawal abroad
}

interface TripParams {
  foreignSpend: number;    // total card spending abroad, ≥ 0
  daysAbroad: number;      // trip length, ≥ 1
  homeCurrency: string;    // ISO 4217
  destinationCurrency: string; // ISO 4217
  vatRate: number;         // destination VAT rate, 0–1
  vatMinSpend: number;     // minimum spend to qualify for refund
  enableVatRefund: boolean;
}

interface TravelCardComparisonResult {
  fxFee: number;
  fxMarkup: number;
  totalFxCost: number;      // fxFee + fxMarkup
  foreignReward: number;
  domesticReward: number;
  annualFeeProrated: number;
  vatRefund: number;
  totalSavings: number;     // rewards + vatRefund − totalFxCost − annualFeeProrated
  netTripCost: number;      // foreignSpend − totalSavings
  score: number;            // −netTripCost (higher = better)
}

interface CompareTravelCardsResult {
  cardResults: Array<{
    card: TravelCardInput;
    result: TravelCardComparisonResult;
  }>;
  bestCardIndex: number;    // index of card with highest score
}
```

## 3. Store — `src/lib/storage/travel-card-store.ts`

- Zustand + `persist`, key `finplan:travel-card:v1`, `version: 1`.
- Actions: `setCards(cards)`, `addCard(card)`, `updateCard(id, patch)`,
  `removeCard(id)`, `setTripParams(params)`, `setCurrency(c)`,
  `replaceState(snapshot)`, `reset()`.
- Persisted slice holds only the data above — no functions/Dates/Maps.

## 4. Math usage — `src/lib/finance/travel-card.ts`

### Core model

Per-card trip cost calculation:

1. **FX fee** = `foreignSpend × fxFeePercent`
2. **FX markup** = `foreignSpend × fxMarkupPercent`
3. **Foreign reward** = `foreignSpend × rewardForeignPercent`
4. **VAT refund** (if enabled):
   - If `foreignSpend ≥ vatMinSpend`: `refund = foreignSpend × vatRate`
   - Else: `refund = 0`
5. **Net trip cost** = `foreignSpend + fxFee + fxMarkup + annualFeeProrated
   − foreignReward − vatRefund`

`annualFeeProrated = annualFee × (daysAbroad / 365)`

### Functions

- `computeCardTripCost(card, trip)`: Returns `TravelCardComparisonResult`
  for one card against trip params.
- `compareTravelCards(cards, trip)`: Returns `CompareTravelCardsResult`
  with per-card results and best-card index.
- `estimateVatRefund(foreignSpend, vatRate, minSpend)`: Returns the
  VAT refund amount.

### Constants

```ts
const VAT_PRESETS: Record<string, { rate: number; minSpend: number }> = {
  EU:     { rate: 0.20, minSpend: 75.01 },
  UK:     { rate: 0.20, minSpend: 35.00 },
  Japan:  { rate: 0.10, minSpend: 5000.00 },
  Thailand: { rate: 0.07, minSpend: 2000.00 },
  Australia: { rate: 0.10, minSpend: 300.00 },
  None:   { rate: 0, minSpend: 0 },
};
```

## 5. UI layout

Single page, mobile-first, max-w ~5xl, stacked sections:

1. **Toolbar** — currency select, SeedDemoButton, ExportImportButtons,
   reset.
2. **Cards list** — one card per sub-card (min 1, max 5). Each card:
   name, annual fee, FX fee %, FX markup %, foreign reward %,
   domestic reward %, ATM fee. Inline validation.
3. **Trip inputs** — foreign spend, days abroad, destination currency,
   VAT toggle with country preset select and custom VAT rate/min spend
   fields.
4. **Stats** — best card badge, per-card net cost, total savings vs
   worst card.
5. **Cost breakdown chart** — Recharts BarChart, one bar per card,
   stacked segments: FX cost, reward, VAT refund, annual fee.
6. **Simulator** — adjusting trip spend shows live recompute of all
   card results.

Hydration: persisted store hydrates after mount; the tool renders a
skeleton until `mounted` to avoid SSR mismatch.

## 6. Demo seed — `src/lib/demo/travel-card.ts`

Returns a complete `TravelCardToolPersisted` with three cards:
- "Wise card": 0% annual fee, 0.5% FX fee, 0% markup, 1% foreign reward
- "Travel rewards card": $95 annual fee, 3% FX fee, 1% markup, 3% foreign reward
- "No-fee debit": 0% annual fee, 0% FX fee, 0% markup, 0% reward, $5 ATM fee
- Trip: $3,000 foreign spend, 14 days, USD, EUR, EU VAT preset

## 7. Export / import

Envelope via `createExportEnvelope("travel-card", 1, snapshot)`;
filename `finplan-travel-card-YYYY-MM-DD.json`. Import validates
`readExportEnvelope(value, "travel-card")` + `schemaVersion === 1`,
sanitizes fields, then replaces state wholesale. Invalid imports
raise the shared import error.

## 8. i18n

All strings under top-level `"travel-card"` namespace in `en.json` /
`th.json` (keys kept in sync). No hardcoded copy. Reuses `shared.*`
keys for seed/export/import buttons.

## 9. Tests

- Finance: `travel-card.ts` unit tests — single card cost, comparison
  with multiple cards, VAT refund eligible/ineligible, zero FX fee,
  ATM fee, edge cases (0 spend, 0 days).
- Store: initial state, addCard/updateCard/removeCard, replaceState
  round-trip, reset, clamp validations.
- Seed: valid against `computeCardTripCost`, positive balances,
  realistic values.

## 10. Out of scope

Dynamic exchange rates, multi-leg trip routing, card loyalty tiers,
points-vs-cashback optimization, travel insurance integration.
