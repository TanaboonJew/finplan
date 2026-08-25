# Spec — Statement parser (`/statement`)

Phase 18 — MASTER-PLAN section 6 row 18. **CSV-only** import (per plan:
"PDF/CSV import (start CSV-only)"), transaction categorization, and a rules
engine for auto-categorization. PDF parsing is explicitly deferred to the
post-1.0 backlog.

## 1. Purpose

Let a user paste a bank/card CSV export, auto-categorize its transactions
with a personal rule set (keyword → category), review/adjust categories,
and see per-category and per-month summaries. All data stays on-device.

## 2. Data model

```ts
interface StatementTransaction {
  id: string;         // crypto.randomUUID() at parse time
  date: string;       // YYYY-MM-DD (validated real calendar date)
  description: string;
  amount: number;     // >0 money in, <0 money out
  category: string;   // free string; default UNCATEGORIZED
}

interface CategoryRule {
  id: string;
  pattern: string;    // case-insensitive substring match on description
  category: string;
}

interface StatementToolPersisted {
  transactions: StatementTransaction[];
  rules: CategoryRule[];
}
```

Suggested category ids (labels via i18n): groceries, dining, transport,
shopping, bills, health, entertainment, income, transfer, uncategorized.
Custom category strings are allowed and rendered verbatim.

## 3. Pure logic — `src/lib/finance/statement.ts`

All pure, no React, Vitest-covered.

```ts
const UNCATEGORIZED = "uncategorized";

function isValidIsoDate(value: unknown): boolean;
// Strict YYYY-MM-DD plus a real-calendar-date check (no 2026-02-30).

function normalizeDate(raw, rowNumber): string;
// Accepts YYYY-MM-DD or DD/MM/YYYY (day-first when day > 12 ambiguity is
// resolved as day-first) and YYYY/MM/DD; throws RangeError with row number
// otherwise.

function parseStatementCsv(text): StatementTransaction[];
// - strips BOM; sniffs , ; or tab delimiters; CRLF/LF; quoted fields
// - header detection over aliases (case-insensitive, spaces stripped):
//     date|transactiondate|posted   -> date        (required)
//     description|memo|payee|narrative|details -> description (required)
//     amount|value                  -> amount      (one of amount / debit+credit)
//     debit|withdrawal              -> negative column
//     credit|deposit                -> positive column
// - single amount column: value used as-is (sign carries direction)
// - debit+credit columns: amount = credit - debit (blank treated as 0)
// - rows without a valid date/description/amount throw RangeError("row N: …")
// - TypeError on empty input; RangeError when no data rows parsed

function matchesRule(description, pattern): boolean;
// Case-insensitive substring; empty pattern never matches.

function applyRules(
  transactions: readonly StatementTransaction[],
  rules: readonly CategoryRule[]
): StatementTransaction[];
// Returns NEW transaction objects; first matching rule wins; unmatched keep
// their current category.

function summarizeByCategory(
  transactions
): Array<{ category: string; total: number; count: number }>;
// Sorted by |total| desc then name asc.

function monthlyNet(transactions): Array<{ month: string; net: number }>;
// YYYY-MM keys sorted asc.
```

Edge cases covered by tests: empty input, missing required columns,
debit/credit pairing, sign handling, DD/MM vs MM/DD ambiguity rule, invalid
calendar dates, first-match-wins precedence, unicode descriptions.

## 4. Store — `src/lib/storage/statement-store.ts`

- Zustand + `persist`, key `finplan:statement:v1`, `version: 1`.
- Actions: `setTransactions`, `removeTransaction`, `updateCategory(id, cat)`,
  `addRule(pattern, category)`, `updateRule(id, patch)`, `removeRule(id)`,
  `applyRulesToAll()` (uses finance.applyRules against current state),
  `replaceAll(data)`, `reset()`.
- Export schema version constant: `STATEMENT_EXPORT_SCHEMA_VERSION = 1`.
- `parseStatementToolState(value)` sanitizer validating all fields; throws
  TypeError on bad data.

## 5. UI layout

Single page, mobile-first, max-w ~6xl:

1. **Toolbar** — SeedDemoButton, ExportImportButtons, reset.
2. **Paste panel** — textarea + Parse button; errors shown with role="alert";
   successful parse replaces transactions and runs current rules.
3. **Stats** — money in, money out, net, transaction count.
4. **Category summary** — bar-style list (CSS bars, no chart lib needed):
   label, count, total; tone by sign.
5. **Rules panel** — list of rules (pattern → category) with edit/remove,
   add-rule form, and an "Apply rules" button that re-runs matching over all
   imported transactions.
6. **Transactions table** — date, description, amount, category select
   (suggested categories + free-text option preserved), remove button.
7. Empty states for no transactions / no rules; hydration skeleton.

Validation surfaced from parser verbatim; category selects always hold a
valid current value.

## 6. Demo seed — `src/lib/demo/statement.ts`

Twelve realistic transactions across ≥6 categories over two months plus
four rules (e.g. "starbucks" → dining, "salary" → income). Must produce a
positive net and demonstrate rules firing on a fresh paste.

## 7. Export / import

JSON envelope `createExportEnvelope("statement", 1, data)`; filename
`finplan-statement-YYYY-MM-DD.json`; import validates tool + schemaVersion
=== 1 then replaces wholesale after sanitization.

## 8. i18n

Top-level `"statement"` namespace in en/th. Reuses `shared.*`.

## 9. Tests

- Parser: happy paths (single amount, debit/credit), aliases, delimiters,
  quoting, date normalization incl. invalid dates, error row numbers.
- Rules: case-insensitivity, precedence, non-matching, unicode, applyRules
  immutability.
- Summaries: grouping, sorting, empty input.
- Store: CRUD, applyRulesToAll, persistence, schema version, sanitizer.
- Seed: valid under sanitizer + rules, positive net.

## 10. Out of scope

PDF parsing (post-1.0 backlog), OFX/QIF formats, deduplication against prior
imports, multi-account merging, cloud sync.
