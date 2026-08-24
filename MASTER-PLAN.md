# FinPlan Toolkit — Master Plan

> Working name: **FinPlan** (rename freely). A local-first personal finance toolkit hub.
> Feature-inspired by plantung.mymoneytoolkit.app — **do NOT copy its name, logo, images, Thai copy, or any proprietary assets.** Original design, original content, English-first.

---

## 1. Product summary

A hub site (`/`) listing ~17 self-contained finance planning tools. Each tool runs entirely client-side, persists to browser storage, and shares one design system + one finance math library.

**Positioning on resume:** "Local-first financial planning toolkit — Next.js, TypeScript, 17 interactive tools, tested finance engine, offline-capable PWA."

## 2. Non-negotiable rules (every session must follow)

1. **No copying** of the original site's branding, text, or assets. Feature parity only.
2. **English-first UI.** All strings go through the i18n layer (`en` default, `th` added later). No hardcoded strings in components.
3. **Local-only persistence.** Zustand + `persist` middleware (localStorage) for settings/small state; Dexie (IndexedDB) only where data gets big (statement imports).
4. **Finance math lives in `src/lib/finance`** as pure functions with Vitest unit tests. Components never do raw money math inline.
5. **Every tool ships complete**: responsive, dark mode, i18n keys, persistence, demo-data seed button, JSON export/import, empty states.
6. TypeScript strict mode. No `any`. Lint + typecheck + tests pass before marking a phase done.
7. **Static-export compatible only.** The site ships as `output: 'export'` to GitHub Pages: no proxy/middleware, no server actions/route handlers, no ISR, images unoptimized, every URL must be a prerendered file. Locale prefixes are always explicit (`/en/...`, `/th/...`).

## 3. Stack (decided)

| Concern | Choice |
|---|---|
| Framework | Next.js 15+ (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| State | Zustand (+ persist) |
| Big local data | Dexie (IndexedDB) |
| Charts | Recharts |
| i18n | next-intl (`en`, `th`) |
| Tests | Vitest (+ @testing-library/react where useful) |
| Deploy | GitHub Pages — https://tanaboonjew.github.io/finplan/ (static export, basePath `/finplan`) |

## 4. Repository layout

```
finplan/
├── MASTER-PLAN.md            ← this file (status table lives here)
├── docs/
│   └── specs/<tool>.md       ← one spec per tool, written before building it
├── public/
└── src/
    ├── app/
    │   ├── page.tsx          ← hub landing page
    │   ├── layout.tsx        ← shell: header, lang toggle, dark mode, footer
    │   └── (tools)/
    │       ├── budget/page.tsx
    │       ├── debt/page.tsx
    │       └── ...
    ├── components/
    │   ├── ui/               ← shadcn primitives
    │   └── shared/           ← MoneyInput, PercentInput, CardShell, StatCard,
    │                            MonthGrid, ChartCard, ExportImportButtons, SeedDemoButton
    ├── lib/
    │   ├── finance/          ← PURE math: no React, fully unit-tested
    │   │   ├── compound.ts   FV/PV/annuities
    │   │   ├── amortization.ts loan schedules
    │   │   ├── payoff.ts     snowball/avalanche/hybrid simulation
    │   │   ├── tax.ts        configurable bracket engine
    │   │   ├── rates.ts      APR↔monthly↔effective conversions
    │   │   ├── npv-irr.ts
    │   │   └── format.ts     currency/percent formatting
    │   ├── storage/          ← zustand stores per tool + dexie db
    │   └── demo/             ← seed data generators per tool
    └── i18n/
        ├── en.json
        └── th.json           (added when Thai phase starts)
```

## 5. Design system (Phase 0)

- Light/dark via CSS variables (shadcn convention).
- Accent: emerald/green family ("growth" theme). Neutral zinc grays.
- Type scale default Tailwind; numbers use tabular-nums.
- Hub cards: icon/image slot, badge slot ("New", "Popular"), title, one-liner, CTA.
- Mobile-first; every tool usable at 375px width.

## 6. Tools & build order

Status legend: ⬜ todo · 🟦 spec written · ✅ done

| # | Route | Tool | MVP scope | Improvements over original | Status |
|---|---|---|---|---|---|
| 0 | `/` | Hub landing | Hero, stats band, category sections, card grid | Search/filter, keyboard nav | ✅ |
| 1 | `/debt` | Debt payoff planner | Multiple debts, Snowball vs Avalanche vs Hybrid, month-by-month schedule chart, total interest comparison | Extra-payment simulator, payoff date picker | ✅ |
| 2 | `/budget` | Yearly budget | Categories × 12 months grid, planned vs actual, health score | Rollover unused budget option | ⬜ |
| 3 | `/retirement` | Retirement planner | Age/income/savings inputs, growth projection chart, FIRE number | Monte Carlo-lite (inflation scenarios) | ⬜ |
| 4 | `/jar` | Six Jars manager | 6 jars w/ % split, income distribution, balance tracking | Custom jars, transfer history log | ✅ |
| 5 | `/loan` | Loan explainer | Amortization viz, principal-vs-interest split over time | Refinance break-even calculator | ⬜ |
| 6 | `/tax` | Tax planner | Bracket engine (configurable table), deductions, take-home breakdown | Multi-country bracket presets (TH/US) | ⬜ |
| 7 | `/timeline` | Life goals timeline | Goals (house/kids/retire) on one timeline, cash overlap view | Conflict detection between goals | ⬜ |
| 8 | `/pay` | Subscriptions tracker | Monthly/annual subs, totals, renewal calendar | Price-increase history, cancel reminders (local) | ⬜ |
| 9 | `/dca` | DCA fee comparator | Fund/broker fee inputs, long-horizon cost compounding chart | Breakeven horizon calculation | ⬜ |
| 10 | `/flow` | Cash flow planner | Income/expense streams visualized monthly | What-if sliders with live recompute | ⬜ |
| 11 | `/credit-card` | Credit card compare | Cards CRUD, fee/rewards fields, spend-based ranking | Rewards value estimator per spend profile | ⬜ |
| 12 | `/travel-card` | Travel card comparator | FX fees, rewards abroad, VAT refund calc | Trip cost simulator | ⬜ |
| 13 | `/insurance` | Insurance manager | Policies list, coverage summary per member | Coverage-gap checklist | ⬜ |
| 14 | `/strategy` | Investment strategy board | Thesis/scenario/risk cards, kanban-ish layout | Export board as markdown | ⬜ |
| 15 | `/kingdom` | Gamified budget kingdom | Category "buildings", growth animation to goal | Achievements stored locally | ⬜ |
| 16 | `/wake-up` | Readiness quiz | 10-question scored checklist | Personalized action tips per answer | ⬜ |
| 17 | `/portfolio-analyzer` | Portfolio dashboard | Paste CSV/table → allocation donut, concentration warnings | Benchmark drift indicator | ⬜ |
| 18 | `/statement` | Statement parser | PDF/CSV import (start CSV-only), categorize transactions | Rules engine for auto-categorization | ⬜ |

Fun extras (`moodeng`, `kilocash`, `pipe-cleaner`) are **out of scope**.

## 7. Phases

Each phase ≈ one session. Keep sessions single-phase.

- **Phase 0 — Scaffold:** repo init, Next.js + TS + Tailwind + shadcn, app shell, hub landing page with all cards (dead links ok), i18n wiring, dark mode, deploy pipeline. ✅
- **Phase 1 — Foundations:** `lib/finance` full implementation + Vitest suite; shared components (MoneyInput, StatCard, ChartCard, ExportImportButtons, SeedDemoButton); storage conventions doc. ✅
- **Phases 2–19 — Tools:** one tool per phase, in table order. Spec first (`docs/specs/x.md`), then implement, then test.
- **Phase 20 — Polish:** PWA/offline, SEO metadata per tool, OG images, accessibility pass, README with screenshots, rename check.

## 8. Session protocol (paste this pattern each time)

```
Read E:\resume\finplan\MASTER-PLAN.md. You are executing Phase <N>: <name>.
Follow section 2 rules strictly. If a spec exists in docs/specs/, follow it;
otherwise write the spec first and get my OK. When done: run lint/typecheck/tests,
update the Status column above, and summarize what changed.
```

## 9. Definition of Done (any tool)

- [ ] Route renders, mobile-responsive, light/dark correct
- [ ] All strings via i18n `en.json`
- [ ] State persisted locally, survives reload
- [ ] Math extracted into `lib/finance` with passing Vitest cases (incl. edge cases)
- [ ] Demo-data seed button + JSON export/import working
- [ ] Empty states + input validation friendly
- [ ] Lint, typecheck, tests green; status table updated
