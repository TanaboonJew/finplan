# Spec — Credit card compare (`/credit-card`)

Phase 11 · MASTER-PLAN section 6 row 11. Cards CRUD, fee/rewards fields,
spend-based ranking; rewards value estimator per spend profile as the
improvement.

## 1. Purpose

Let a user enter every credit card they carry (or are considering), define
their monthly spending across categories, and instantly see which card
earns the most net rewards after fees. A rewards-value estimator shows
the annual dollar value each card delivers for the user's actual spending
mix, making comparison trivial.

## 2. Data model

Money is plain major-unit numbers; rates are decimal fractions (0.02 = 2%);
spend categories are string IDs. All persisted via Zustand + localStorage.

```ts
type RewardType = "cashback" | "points" | "miles";

interface RewardRate {
  /** Spending category ID, or "all" for a flat/default rate */
  categoryId: string;
  /** Reward rate as a decimal fraction of spend (0.015 = 1.5%) */
  rate: number;
}

interface CreditCardInput {
  id: string;                     // crypto.randomUUID()
  name: string;                   // user label, e.g. "Chase Sapphire"
  network: string;                // Visa / Mastercard / Amex / etc. (free text)
  annualFee: number;              // >= 0
  foreignFee: number;             // decimal fraction, e.g. 0.03
  apr: number;                    // decimal fraction, e.g. 0.2299
  rewardType: RewardType;
  /** Multiple rate tiers: flat rate uses one entry with categoryId "all" */
  rewardRates: RewardRate[];
  /** Optional sign-up bonus as a dollar value (0 = none) */
  signupBonus: number;            // >= 0
  /** How many points/miles equal $1 in value (only for points/miles type) */
  pointValue: number;             // >= 0, default 1 for cashback
  notes: string;
}

interface SpendCategory {
  id: string;
  name: string;
  /** Annual spend in major currency units */
  annualSpend: number;
}

interface SpendProfile {
  name: string;
  categories: SpendCategory[];
}

interface CreditCardToolPersisted {
  cards: CreditCardInput[];
  /** Predefined or custom spend profiles */
  profiles: SpendProfile[];
  /** Currently selected profile ID (index into profiles array) */
  activeProfileIndex: number;
}
```

Derived values (rewards, net value, ranking) are recomputed on render via
pure functions and never persisted.

## 3. Pure math — `src/lib/finance/credit-card.ts`

All pure, no React, Vitest-covered.

```ts
interface RewardResult {
  annualRewardValue: number;     // dollar value of rewards earned
  rewardsByCategory: Array<{
    categoryId: string;
    spend: number;
    rate: number;
    rewardValue: number;
  }>;
}

interface CardComparisonResult {
  cardId: string;
  cardName: string;
  annualRewardValue: number;
  totalFees: number;             // annualFee
  signupBonus: number;
  netAnnualValue: number;        // rewardValue + signupBonus - annualFee
  effectiveRate: number;         // netAnnualValue / totalSpend (0 if no spend)
  rewardsByCategory: RewardResult["rewardsByCategory"];
}

function computeCardRewardValue(
  card: CreditCardInput,
  categories: readonly SpendCategory[]
): RewardResult;

function compareCards(
  cards: readonly CreditCardInput[],
  categories: readonly SpendCategory[]
): CardComparisonResult[];

function totalSpend(categories: readonly SpendCategory[]): number;
```

Key behavior:
- `computeCardRewardValue`: for each spending category, look up the card's
  reward rate. If no matching rate tier exists, use the "all" tier. If no
  "all" tier either, reward = 0 for that category.
- `compareCards`: calls `computeCardRewardValue` per card, subtracts
  `annualFee`, adds `signupBonus`, sorts descending by `netAnnualValue`.
- `totalSpend`: sum of all category `annualSpend` values.
- Edge cases: zero cards → empty array; zero spend → net value = −annualFee + signupBonus.

## 4. Store — `src/lib/storage/credit-card-store.ts`

- Zustand + `persist`, key `finplan:credit-card:v1`, `version: 1`.
- Actions: `addCard`, `updateCard`, `removeCard`, `addProfile`,
  `updateProfile`, `removeProfile`, `setActiveProfileIndex`,
  `replaceAll(data)`, `reset()`.
- Persisted slice holds only the data above — no functions/Dates/Maps.
- IDs via `crypto.randomUUID()`.
- Export schema version constant: `CREDIT_CARD_EXPORT_SCHEMA_VERSION = 1`.
- `parseCreditCardToolState(value: unknown): CreditCardToolPersisted` sanitizer
  for imports (validates all fields, rejects bad data).

## 5. UI layout

Single page, mobile-first, max-w ~6xl, stacked sections:

1. **Toolbar** — SeedDemoButton, ExportImportButtons, reset.
2. **Summary stats** — 4 cards: best card name + net value, total spend,
   average effective rate across cards, number of cards compared.
3. **Spend profile editor** — select/edit profile, list of categories with
   annual spend inputs; add/remove categories; save profile.
4. **Cards editor** — one card form (collapsible) per card with all fields;
   inline add/edit; delete with confirm. Empty state when no cards.
5. **Ranking table** — cards sorted by net annual value; columns: rank,
   card name, annual rewards, annual fee, signup bonus (year 1 only), net
   value, effective rate. Highlighted top row. ChartCard with a horizontal
   bar chart of net values.
6. **Per-card detail** — expandable rows showing reward breakdown by spending
   category for each card.

Hydration: persisted store hydrates after mount; the tool renders a skeleton
until `mounted` to avoid SSR mismatch.

Validation: card name required; all money fields >= 0; APR/foreignFee 0–1;
reward rates 0–1; at least one reward rate per card. Spend amounts >= 0.

## 6. Demo seed — `src/lib/demo/credit-card.ts`

Returns a complete `CreditCardToolPersisted` with:
- 4 cards: flat-rate cashback, category cashback, points card, no-fee card
- 1 spend profile ("Typical") with 6 categories: groceries, dining, travel,
  gas, online shopping, everything else — realistic annual amounts.

## 7. Export / import

Envelope via `createExportEnvelope("credit-card", 1, data)`; filename
`finplan-credit-card-YYYY-MM-DD.json`. Import validates
`readExportEnvelope(value, "credit-card")` + `schemaVersion === 1`,
sanitizes fields, replaces state wholesale. Invalid imports raise the
shared import error.

## 8. i18n

All strings under top-level `"credit-card"` namespace in `en.json` / `th.json`.
Hyphenated key name matches the tool slug. Reuses `shared.*` keys for
seed/export/import buttons.

## 9. Tests

- Finance math: `computeCardRewardValue` with flat rate, category-specific
  rate, missing rate fallback, zero spend; `compareCards` ranking order,
  fee subtraction, signup bonus, effective rate; `totalSpend` basic.
- Store: initial state, CRUD round-trips, replaceAll/reset, persistence.
- Seed: valid against `compareCards`, realistic shapes, all cards have
  positive reward values.

## 10. Out of scope

Multi-card reward stacking (using two cards for one purchase), balance
transfer calculations, statement-import integration, travel-card features
(separate tool #12).
