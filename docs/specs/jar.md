# Spec — Six Jars manager (`/jar`)

Master Plan row 4. Status: implemented in this phase.

## What it does

A local-first implementation of the classic "six jars" money-management
method: every unit of income is split across a small set of jars by
percentage, spending and transfers are logged per jar, and balances are
always derived from that log.

MVP scope (Master Plan): 6 jars with a % split, income distribution,
balance tracking.
Improvements over the original: custom jars (add/rename/re-split/delete) and
a transfer history log.

## Non-goals

- No recurring/auto-distribution scheduling (record income manually).
- No interest or growth modeling — jar balances are plain ledgers.
- No multi-currency support; amounts are displayed in the active locale's
  default currency via `lib/finance/format`.

## Data model (persisted slice)

Stored by `src/lib/storage/jar-store.ts` under localStorage key
`finplan:jar:v1`, `version: 1`. Plain JSON only (storage conventions rule 4).

```ts
interface Jar {
  id: string;                // crypto.randomUUID()
  name: string;              // user-editable label, i18n-agnostic
  allocationPercent: number; // decimal fraction of income, e.g. 0.55
}

interface JarIncomeEntry {
  id: string;
  amount: number;            // total income received
  date: string;              // ISO YYYY-MM-DD
  note: string;
  allocations: { jarId: string; amount: number }[]; // snapshot at record time
}

interface JarExpenseEntry { id: string; jarId: string; amount: number;
                            date: string; note: string }
interface JarTransferEntry { id: string; fromJarId: string; toJarId: string;
                             amount: number; date: string; note: string }

interface JarToolState {
  jars: Jar[];
  incomes: JarIncomeEntry[];
  expenses: JarExpenseEntry[];
  transfers: JarTransferEntry[];
}
```

Key decisions:

- **Allocations are snapshotted** on each income entry, so later edits to the
  % split never rewrite history (real accounting behavior).
- Zero-share jars receive no allocation row at all, so a jar that never
  received money stays deletable.
- Deleting a jar with history is blocked (button disabled + hint) and the
  store no-ops as defense in depth — ledgers never reference missing jars.
- Derived values (balances, totals, chart data) are never persisted — they are
  recomputed from `lib/finance/jars` on render.

## Pure math (`src/lib/finance/jars.ts`, Vitest-covered)

- `allocateIncome(amount, jars)` — proportional split by
  `allocationPercent` with largest-remainder rounding so allocated cents sum
  to exactly `amount`. Throws on negative/non-finite amounts, non-finite or
  negative percentages.
- `computeJarBalances(jars, incomes, expenses, transfers)` — per-jar balance =
  Σ allocations − Σ expenses − Σ transfers out + Σ transfers in. Unknown ids
  are tolerated and grouped under `null`.
- `sumJarActivity(...)` — totals used by the stats band and chart:
  total income, total spent, total transferred, net on hand.
- `validateJarSplit(jars)` — returns `{ totalPercent, isValid }`
  (valid ⇔ total = 1 within 1e-9); drives the split warning UI.

## UI

Single client page at `/[locale]/jar`, server wrapper provides metadata +
`setRequestLocale` (Next 16 async params). All strings via the top-level
`jar.*` i18n namespace (`en`/`th`). Mobile-first, dark-mode safe,
tabular-nums for numbers.

Sections:

1. **Stats band** — total income recorded, total spent, net on hand.
2. **Income card** — `MoneyInput` + optional note + date → "Distribute"
   records an income entry with snapshotted allocations. Below it, a compact
   income log (amount, date, note, delete).
3. **Jars grid** — one card per jar: name (editable), % of split (editable),
   current balance, allocated-to-date vs spent mini-bars, quick "Spend"
   form (amount + note). Delete-jar button. Empty state when no jars exist.
4. **Split editor** — inline in the grid header: shows total % with a
   warning chip when ≠ 100%, plus "Reset to classic 6-jar split" action.
5. **Transfers card** — from/to selects (distinct jars), amount, note →
   logs a transfer. Transfer history list with delete (the improvement).
6. **Balance chart** — Recharts donut of current balances per jar inside
   the shared `ChartCard`; hidden when all balances are zero.
7. **Toolbar** — shared `SeedDemoButton` (confirm overwrite),
   `ExportImportButtons` (envelope `tool: "jar"`, schemaVersion 1,
   filename `finplan-jar-YYYY-MM-DD.json`), and a reset action.

Persistence/hydration follows storage conventions rule 5: persisted state is
only rendered after mount (skeleton placeholders during SSR/first paint).

## Demo seed (`src/lib/demo/jar.ts`)

Returns a complete `JarToolState` snapshot through the store's import path:
classic six jars (Necessities 55%, Financial freedom 10%, Education 10%,
Long-term savings 10%, Play 10%, Give 5%), three months of salary
distributions (round, obviously fake amounts), a handful of expenses and two
transfers so every section has content.

## Validation

- Income/spend/transfer forms reject non-positive or non-finite amounts.
- Transfers require distinct source/target jars and warn (but do not block)
  when the source balance would go negative? — No: blocked, matching real
  jar behavior. The spend form likewise refuses more than the jar holds.
- Import rejects anything that fails `readExportEnvelope(_, "jar")` or whose
  `data` shape fails the store's structural guard (arrays present, finite
  numbers, percent fractions ≥ 0).

## Definition of Done mapping

- Route renders, responsive, light/dark correct → client components using
  design-system tokens only.
- i18n → all copy under `jar.*` in `en.json` + `th.json` (key parity test).
- Persistence → zustand persist, survives reload.
- Math → `lib/finance/jars.ts` pure functions + `tests/finance/jars.test.ts`.
- Demo seed / export / import / empty states → toolbar + guards above.
- Lint/typecheck/test green before commit.
