# Kingdom — Gamified Budget Planner

> Tool #15 in the MASTER-PLAN. Route: `/kingdom`.

## Concept

Turn budget categories into "buildings" in a personal kingdom. Each building has a savings goal. Users deposit money toward goals, buildings grow, and local achievements unlock at milestones. The metaphor makes saving feel like building something tangible.

## Data Model

### Building

```ts
interface Building {
  id: string;
  name: string;
  icon: BuildingIcon;       // tower | house | castle | hut | temple | bridge
  targetAmount: number;     // savings goal, > 0
  currentAmount: number;    // accumulated, >= 0, never exceeds target
  color: string;            // Tailwind color token: emerald | blue | amber | rose | violet | cyan
  createdAt: string;        // ISO date
}
```

Building icons map to lucide-react icons: `Castle`, `Home`, `TowerControl`, `Tent`, `Church`, `Bridge`.

### Deposit

```ts
interface Deposit {
  id: string;
  buildingId: string;
  amount: number;           // > 0
  date: string;             // YYYY-MM-DD
  note: string;
}
```

### Achievement

```ts
type AchievementId =
  | "first_deposit"
  | "first_building"
  | "half_funded"
  | "first_complete"
  | "five_buildings"
  | "thousand_club"
  | "five_achievements"
  | "kingdom_complete";

interface Achievement {
  id: AchievementId;
  unlockedAt: string | null; // ISO date or null
}
```

Achievements are computed from state — the store tracks `unlockedAt` timestamps only. The list of all possible achievements is defined in `finance/kingdom.ts` as a constant.

### Persisted State

```ts
interface KingdomToolPersisted {
  kingdomName: string;
  buildings: Building[];
  deposits: Deposit[];
  achievements: Achievement[];
}
```

## Finance Math (`src/lib/finance/kingdom.ts`)

Pure functions, no React, fully unit-tested.

```ts
function buildingProgress(building: Building): number;  // 0–1 clamped
function buildingTier(progress: number): BuildingTier;  // 0–5 thresholds
function totalWealth(buildings: Building[]): number;
function buildingsCompleted(buildings: Building[]): number;
function evaluateAchievements(
  buildings: Building[],
  deposits: Deposit[],
  prior: Achievement[]
): Achievement[];  // returns full list with new unlocks populated
```

Tier thresholds: 0% = foundation, 20% = base, 40% = walls, 60% = roof, 80% = furnished, 100% = complete.

## UI Components

### `kingdom-tool.tsx` (main)
- `useMounted()` SSR skeleton pattern
- Layout: `div.mx-auto.w-full.max-w-5xl.flex.flex-col.gap-6.px-4.py-8`
- Header: kingdom name (editable inline), subtitle
- Toolbar: seed demo, export/import, reset
- Stats row: Total Wealth, Buildings count, Achievements unlocked
- Building grid (responsive: 1 col mobile, 2 col sm, 3 col lg)
- Add Building form below grid
- Achievements panel at bottom

### `kingdom-toolbar.tsx`
- Composes `SeedDemoButton`, `ExportImportButtons`, reset Button
- Export/import uses `createExportEnvelope`/`readExportEnvelope` from `@/lib/storage/json`

### `kingdom-grid.tsx`
- Maps buildings to `BuildingCard` components
- Empty state when no buildings

### `building-card.tsx`
- Icon, name, progress bar with percentage
- Tier badge (foundation → complete)
- Color accent strip
- "Deposit" button opens deposit form inline
- Deposit history (last 5) with remove option

### `add-building-form.tsx`
- Name input, icon picker (6 options as icon buttons), color picker (6 color swatches), target amount input
- Validates: name non-empty, target > 0, max 12 buildings

### `deposit-form.tsx`
- Amount input, date input, note input
- Validates: amount > 0, building exists, amount is capped at the remaining target (never exceeds it)

### `achievements-panel.tsx`
- Grid of achievement badges
- Locked: grayscale + lock icon
- Unlocked: full color + unlock date
- Recently unlocked highlighted with subtle glow

## Route Page

`src/app/[locale]/(tools)/kingdom/page.tsx` — thin server wrapper following jar/page.tsx pattern.

## i18n

Namespace: `kingdom` (top-level, not nested under `tools`).

Keys follow the pattern of other tools: `title`, `subtitle`, `loading`, `stats`, `toolbar`, plus `buildings`, `deposits`, `achievements` sections.

## Files to Create

| File | Purpose |
|---|---|
| `docs/specs/kingdom.md` | This spec |
| `src/lib/finance/kingdom.ts` | Pure math functions |
| `src/lib/storage/kingdom-store.ts` | Zustand store |
| `src/lib/demo/kingdom.ts` | Demo seed data |
| `src/components/tools/kingdom/kingdom-tool.tsx` | Main client component |
| `src/components/tools/kingdom/kingdom-toolbar.tsx` | Toolbar |
| `src/components/tools/kingdom/kingdom-grid.tsx` | Building grid |
| `src/components/tools/kingdom/building-card.tsx` | Individual building |
| `src/components/tools/kingdom/add-building-form.tsx` | Add building form |
| `src/components/tools/kingdom/deposit-form.tsx` | Deposit form |
| `src/components/tools/kingdom/achievements-panel.tsx` | Achievements display |
| `src/components/tools/kingdom/controls.ts` | useMoney + field classes |
| `src/app/[locale]/(tools)/kingdom/page.tsx` | Route page |
| `tests/finance/kingdom.test.ts` | Finance math tests |
| `tests/storage/kingdom-store.test.ts` | Store tests |
| `tests/demo/kingdom-seed.test.ts` | Demo seed tests |

## Acceptance Criteria

- [ ] Route renders at `/kingdom`, responsive, light/dark
- [ ] All strings via i18n `kingdom` namespace in en.json
- [ ] State persisted to localStorage, survives reload
- [ ] Math in `finance/kingdom.ts` with passing Vitest cases
- [ ] Demo seed button populates 5 buildings with deposits
- [ ] JSON export/import working
- [ ] Empty states and input validation
- [ ] Achievements compute correctly from state
- [ ] Buildings grow toward goals with tier progression
- [ ] Lint, typecheck, tests green
