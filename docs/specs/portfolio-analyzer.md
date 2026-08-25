# Spec — Portfolio analyzer (`/portfolio-analyzer`)

Phase 17 — MASTER-PLAN section 6 row 17. Paste CSV/table → allocation donut,
concentration warnings; benchmark drift indicator.

## 1. Purpose

Let a user paste a CSV of their holdings (or add them by hand) and instantly
see: where their money actually is (allocation donut per asset class),
whether any single position or class dominates (concentration warnings), and
how far the current mix has drifted from their target benchmark mix
(drift indicator). Everything stays on-device.

## 2. Data model

Money is plain major-unit numbers; weights are 0–1 fractions.

```ts
interface Holding {
  id: string;            // crypto.randomUUID()
  symbol: string;        // ticker, e.g. "VTI" (required, non-empty)
  name: string;          // optional friendly name
  assetClass: string;    // e.g. "Equity", "Bonds", "Cash", "Gold"
  quantity: number;      // >= 0
  price: number;         // >= 0, per-unit market price
}

interface PortfolioToolPersisted {
  holdings: Holding[];
  targets: Record<string, number>; // assetClass -> target weight 0..1
}
```

Derived values (values, weights, warnings, drift) are recomputed via pure
functions and never persisted.

## 3. Pure math — `src/lib/finance/portfolio.ts`

All pure, no React, Vitest-covered.

```ts
function holdingValue(holding: Holding): number;
// quantity * price.

function totalValue(holdings: readonly Holding[]): number;

interface Allocation {
  assetClass: string;
  value: number;
  weight: number; // share of total; 0 when total is 0
}
function allocations(holdings): Allocation[];
// Grouped by exact class string, sorted by value desc then name asc.
// Empty portfolio -> [].

const POSITION_WARN = 0.20;   // single holding weight threshold
const CLASS_WARN = 0.60;      // single asset-class weight threshold

type Warning =
  | { kind: "position"; id: string; symbol: string; weight: number }
  | { kind: "class"; assetClass: string; weight: number };

function concentrationWarnings(holdings): Warning[];
// Fires for each holding with weight > POSITION_WARN and each class with
// weight > CLASS_WARN (only when totalValue > 0).

interface ClassDrift {
  assetClass: string;
  actual: number;  // weight 0..1
  target: number;  // weight 0..1
  delta: number;   // actual - target
}
function driftVsTargets(
  holdings,
  targets: Record<string, number>
): ClassDrift[];
// One row per union of classes present in holdings/targets, sorted by
// |delta| desc then class asc. Classes without a target get 0 and vice versa.
// Targets are used as-is (not normalized); delta uses raw weights.

function largestDrift(rows: ClassDrift[]): ClassDrift | null;

function parseHoldingsCsv(text: string): Holding[];
// CSV-first parser:
// - strips BOM; accepts , ; or tab delimiters; CRLF/LF; quoted fields ("")
// - first row may be a header (detected case-insensitively, spaces ignored):
//     required columns symbol|ticker, quantity|qty|shares,
//     price|last|lastprice|unitprice|priceperunit
//     optional columns name, assetClass|asset_class|class
// - headerless rows must be strictly symbol,quantity,price (extra trailing
//   columns ignored; the 4th column becomes the asset class when present)
// - throws RangeError with row number for malformed rows (non-numeric qty/price,
//   negative values, empty symbol), TypeError for an empty input
```

Edge cases covered by tests: zero-total portfolios, weights summing > 1,
empty CSV, quoted commas, delimiter sniffing, malformed rows carrying the row
number in the message.

## 4. Store — `src/lib/storage/portfolio-store.ts`

- Zustand + `persist`, key `finplan:portfolio:v1`, `version: 1`.
- Actions: `setHoldings(holdings)`, `addHolding`, `updateHolding(id, patch)`,
  `removeHolding(id)`, `setTarget(assetClass, weight)`,
  `removeTarget(assetClass)`, `replaceAll(data)`, `reset()`.
- Export schema version constant: `PORTFOLIO_EXPORT_SCHEMA_VERSION = 1`.
- `parsePortfolioToolState(value)` sanitizer validating every field; throws
  TypeError on bad data (imports replace state wholesale only when fully valid).

## 5. UI layout

Single page, mobile-first, max-w ~6xl:

1. **Toolbar** — SeedDemoButton, ExportImportButtons, reset.
2. **Paste panel** — textarea + "Parse CSV" button; parse errors render under
   the box with role="alert"; successful parses append to holdings.
3. **Stats** — StatCards: total value, position count, worst concentration %.
4. **Allocation donut** — Recharts PieChart grouped by asset class with
   legend; empty state when no holdings.
5. **Warnings list** — concentration warnings with tone colors; hidden when none.
6. **Drift table** — per class actual vs target vs delta bars; largest drift
   highlighted as indicator chip in stats row area.
7. **Targets editor** — rows per known class with percent inputs (0–100).
8. **Holdings editor** — editable table/cards: symbol, name, class, qty,
   price; remove buttons; add-row form; validation messages inline.
9. Hydration skeleton until mounted.

Validation: symbol required non-empty; quantity/price finite >= 0; target
weights clamped 0–1; CSV errors surfaced verbatim from the parser.

## 6. Demo seed — `src/lib/demo/portfolio.ts`

Six holdings across Equity/Bonds/Cash/Gold with one deliberate concentration
(a >20% equity fund) so warnings/donut/drift are all demonstrably populated.

## 7. Export / import

JSON envelope `createExportEnvelope("portfolio-analyzer", 1, data)`; filename
`finplan-portfolio-analyzer-YYYY-MM-DD.json`; import validates tool +
schemaVersion === 1 then replaces wholesale after sanitization.

## 8. i18n

All strings under top-level `"portfolio-analyzer"` namespace in en/th.
Reuses `shared.*` for seed/export/import buttons.

## 9. Tests

- Finance math: values, allocations ordering, warning thresholds at exactly
  20%/60%, drift union/sorting, CSV parsing happy/malformed paths.
- Store: CRUD, setTarget clamp, replaceAll/reset/persistence, schema version.
- Seed: valid against parser/store sanitizer, triggers a warning.

## 10. Out of scope

PDF parsing, live price feeds, historical performance charts, tax-lot
accounting, multiple portfolio accounts, currency conversion.
