# Spec — Tax planner (`/tax`)

Phase 6 row 6 · MASTER-PLAN section 6. UI built on top of the existing
`src/lib/finance/tax.ts` engine (Phase 1). The engine provides
`computeProgressiveTax` and `taxableIncomeAfterDeductions` — this tool composes
them with country-bracket presets, deduction management, and a take-home
breakdown visualization.

## 1. Purpose

Let a user select a country tax preset (Thailand or US federal), enter gross
annual income, toggle and customize deductions, and see an instant take-home
pay breakdown: taxable income, total tax, effective/marginal rates, and a
visual waterfall from gross to net. A custom bracket mode allows any
user-defined table.

## 2. Data model

Money is plain major-unit numbers; rates are decimal fractions.

```ts
type CountryPreset = "th" | "us";

interface TaxDeduction {
  id: string;
  name: string;
  amount: number;
  enabled: boolean;
}

type FilingStatus = "single" | "married";

interface TaxSnapshot {
  country: CountryPreset;
  filingStatus: FilingStatus;
  grossIncome: number;
  deductions: TaxDeduction[];
}
```

Derived values (taxable income, tax computation, take-home) are recomputed on
render via the engine and never persisted.

## 3. Bracket presets

### Thailand (TH) — 2024 personal income tax

| Band | Up to (THB) | Rate |
|------|------------|------|
| 1 | 150,000 | 0% |
| 2 | 300,000 | 5% |
| 3 | 400,000 | 10% |
| 4 | 600,000 | 15% |
| 5 | 800,000 | 20% |
| 6 | 1,200,000 | 25% |
| 7 | 2,100,000 | 30% |
| 8 | — | 35% |

Preset deductions (all enabled by default):
- Personal allowance: 60,000
- Social security (Section 33): 9,000
- Insurance (life/health): 25,000
- Retirement fund (RMF/SSF): 50,000
- Child allowance: 30,000 per child (default 1 child)

Currency: THB.

### United States (US) — 2024 federal income tax (single filer)

| Bracket | Up to (USD) | Rate |
|---------|------------|------|
| 1 | 11,600 | 10% |
| 2 | 47,150 | 12% |
| 3 | 100,525 | 22% |
| 4 | 191,950 | 24% |
| 5 | 243,725 | 32% |
| 6 | 609,350 | 35% |
| 7 | — | 37% |

US married-filing-jointly brackets are exactly double the single values.

Preset deductions:
- Standard deduction: 14,600 (single) / 29,200 (married)

Currency: USD.

Presets are defined in `src/lib/finance/tax-presets.ts` as exported constants —
pure data, no React.

## 4. Store — `src/lib/storage/tax-store.ts`

- Zustand + `persist`, key `finplan:tax:v1`, `version: 1`.
- Snapshot shape: `{ country, filingStatus, grossIncome, deductions }`.
- Actions: `setCountry(country)`, `setFilingStatus(status)`,
  `setGrossIncome(amount)`, `toggleDeduction(id)`,
  `setDeductionAmount(id, amount)`, `addCustomDeduction(name, amount)`,
  `removeCustomDeduction(id)`, `replaceState(snapshot)`, `reset()`.
- `setCountry` replaces the deduction list with the preset for the new country.
- `reset()` restores defaults: country "th", filingStatus "single",
  grossIncome 0, TH preset deductions.

## 5. UI layout

Single page, mobile-first, max-w ~5xl, stacked sections:

1. **Toolbar** — country preset select (TH / US), SeedDemoButton,
   ExportImportButtons, reset.

2. **Income input** — `<MoneyInput>` for annual gross income.

3. **Summary stats** — grid of `<StatCard>`:
   - Gross income
   - Total deductions
   - Taxable income
   - Total tax
   - Effective tax rate
   - Take-home pay (annual and monthly)
   All computed from engine: `taxableIncomeAfterDeductions(gross, amounts)`
   then `computeProgressiveTax(taxable, bands)`.

4. **Deductions panel** — list of deductions for the active country. Each row:
   toggle switch, name, editable amount (MoneyInput or plain number input).
   Preset deductions are not deletable. "Add custom deduction" form at the
   bottom (name + amount + add button). Empty state when no custom deductions
   exist.

5. **Bracket breakdown table** — table showing each band: rate, income range
   in that band, tax for that band. Bands where taxable income is zero show
   "--". The top (marginal) band is highlighted. Uses
   `computeProgressiveTax().bands` output.

6. **Take-home waterfall chart** — Recharts stacked bar or waterfall-style
   horizontal bar: Gross Income → (−) Deductions → Taxable Income → (−) Tax
   = Take-Home. Simple two-segment horizontal bar with labels.

Hydration: persisted store hydrates after mount; the tool renders a skeleton
until `mounted` to avoid SSR mismatch.

Validation: gross income must be ≥ 0; deduction amounts must be ≥ 0.
Validation errors shown inline.

## 6. Formatting helpers — `src/components/tools/tax/tax-format.ts`

- `localeTagOf(locale)` → locale BCP-47 tag (same pattern as debt)
- `formatMoney(amount, localeTag, currency)` → formatted currency string
- `formatRate(fraction)` → formatted percentage

## 7. Demo seed — `src/lib/demo/tax.ts`

Returns a complete `TaxSnapshot`: country "th", filingStatus "single",
grossIncome 600000 (THB), all preset deductions enabled at default amounts.
Goes through `replaceState`. Realistic mid-range Thai income scenario showing
a meaningful take-home result.

## 8. Export / import

Envelope via `createExportEnvelope("tax", 1, snapshot)`; filename
`finplan-tax-YYYY-MM-DD.json`. Import validates `readExportEnvelope(value,
"tax")` + `schemaVersion === 1`, sanitizes fields, then replaces state
wholesale.

## 9. i18n

All strings under top-level `"tax"` namespace in `en.json` / `th.json`
(keys kept in sync; covered by existing messages test). No hardcoded copy.
Reuses `shared.*` keys for seed/export/import buttons.

## 10. Tests

- Store: initial state, CRUD actions, country-switch resets deductions,
  replaceState/reset round-trip, persistence under jsdom localStorage.
- Presets: bracket tables are valid (pass `normalizeBands`), deduction
  presets sum correctly, US married brackets are double single.
- Seed: valid snapshot against the store type, TH preset deductions match
  expected amounts.
- UI smoke (testing-library): empty state renders; after seeding, summary
  stats + deductions + bracket table render.

## 11. Out of scope

State/local taxes, itemized deductions calculator, tax planning scenarios
(multiple income sources), capital gains rates, year-over-year comparison —
later phases/improvements.
