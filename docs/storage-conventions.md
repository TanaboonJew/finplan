# Storage conventions

How FinPlan persists data. Everything stays on the device — there is no backend,
no account, and no telemetry. Any code that breaks these rules will come back to
bite the next tool phase, so read this before building a tool.

## Money and rate representation (applies everywhere)

- **Money is a plain `number`** in major units (`1250.75`), never strings, never
  minor-unit integers, never a currency-aware class.
- **Rates are decimal fractions**: `0.05` means 5%. Percentages appear only at
  the UI edge (`PercentInput`, `formatPercent`).
- All finance math lives in `src/lib/finance` as pure functions taking
  **annual** rates and converting internally. Components never do raw money
  math inline (Master Plan rule 4).
- Dates are ISO `YYYY-MM-DD` strings or full ISO timestamps — never
  locale-formatted strings in state.

## Small state: Zustand + persist

One store file per tool under `src/lib/storage/<tool>.ts`.

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface DebtToolState {
  debts: Debt[];
  extraMonthlyPayment: number;
  setDebts: (debts: Debt[]) => void;
  reset: () => void;
}

export const useDebtStore = create<DebtToolState>()(
  persist(
    (set) => ({
      debts: [],
      extraMonthlyPayment: 0,
      setDebts: (debts) => set({ debts }),
      reset: () => set({ debts: [], extraMonthlyPayment: 0 }),
    }),
    {
      name: "finplan:debt:v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

Rules:

1. **Key naming**: `finplan:<tool-slug>:v<N>`. Bump `N` whenever the stored
   shape changes incompatibly.
2. **Version + migrate**: pass `version: N` to `persist` and write a `migrate`
   function instead of bumping the key when a change is backward-compatible.
3. **Persist only user data.** Derived values (totals, chart series) are
   recomputed from `lib/finance` on render — never stored.
4. **No functions, class instances, Dates, or Maps in persisted slices** — JSON
   round-trip must be lossless. Use plain objects/arrays/numbers/strings/null.
5. **Hydration**: persisted stores hydrate after mount. Never branch UI on
   persisted state during SSR; gate client-only reads behind a `mounted`
   flag when output would otherwise mismatch.
6. **Reset path**: every store exposes `reset()`; the demo seeder overwrites
   through the store's setters so persistence picks it up automatically.

## Big data: keep it small instead

The original plan reserved Dexie (IndexedDB) for large imports. In practice
every tool — including the statement parser — stores comfortably in
localStorage through Zustand + persist, and no `db.ts` exists today.

- If a future import grows past a few thousand rows, add Dexie then: one
  database named `finplan`, declared once in `src/lib/storage/db.ts`.
- Until that need is real, do **not** introduce a second persistence layer.
  Trimming oversized CSVs before parse is preferable to new infrastructure.
- Rows in any future IndexedDB table must carry an `id`
  (`crypto.randomUUID()`) and `updatedAt`.

## JSON export / import envelope

Every tool's export is a single envelope produced by `createExportEnvelope`
(`src/lib/storage/json.ts`) and validated by `readExportEnvelope` on import:

```json
{
  "app": "finplan",
  "tool": "debt",
  "schemaVersion": 1,
  "exportedAt": "2026-08-24T00:00:00.000Z",
  "data": { "...tool-specific shape..." }
}
```

- Import flow: `ExportImportButtons` parses the file, `readExportEnvelope`
  checks `app`/`tool`/`schemaVersion`; only then apply `envelope.data` into the
  store. Reject unknown `schemaVersion`s with a friendly i18n message.
- Filenames: `finplan-<tool>-YYYY-MM-DD.json` via `downloadJson`.
- Import replaces tool state wholesale (after validation) — no silent merges.

## Demo seeds

- One generator per tool in `src/lib/demo/<tool>.ts` returning a complete
  snapshot of the tool's persisted slice.
- Seeds go through the same store setters as real edits (rule above) and are
  triggered by `SeedDemoButton`, which confirms before overwriting.
- Demo numbers must look realistic but stay obviously fake (round amounts).

## What never gets stored

- Anything derived by `lib/finance` that can be recomputed cheaply.
- Secrets/tokens — there are none, keep it that way.
- Locale/theme live in their own existing stores, not per-tool state.
