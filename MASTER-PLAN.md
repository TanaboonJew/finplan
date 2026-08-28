# FinPlan Toolkit — Master Plan

> **Status:** 1.0 roadmap implementation complete; release scope frozen.
> **Working name:** FinPlan. A local-first personal-finance planning toolkit hub.
> **Source of truth:** this file defines the product scope and phase status. Tool specs define tool-level behavior; merged code and tests resolve implementation details.

FinPlan is feature-inspired by a personal-finance toolkit pattern, but its branding, copy, assets, implementation, and design are original.

---

## 1. Product summary

FinPlan is a hub site listing **18 self-contained finance planning tools**. Every production route is statically exported with an explicit locale prefix (`/en/...` or `/th/...`). Tools run client-side, persist relevant state to browser storage, and share one design system plus one pure finance/domain library.

**Portfolio positioning:** “Local-first financial planning toolkit — Next.js, TypeScript, 18 interactive tools, tested finance engine, bilingual UI, and offline-capable PWA.”

## 2. Non-negotiable engineering rules

1. **Original product.** Do not copy another product's branding, text, images, or proprietary assets.
2. **Bilingual UI.** User-facing strings go through the i18n layer. English (`en`) and Thai (`th`) are required for 1.0.
3. **Local-only persistence.** Relevant tool state uses versioned Zustand/localStorage stores. IndexedDB/Dexie remains deferred unless the storage conventions are deliberately revised.
4. **Pure finance/domain logic.** Financial calculations and reusable domain rules live in `src/lib/finance/` and are tested independently of React.
5. **Complete tools, not demos.** A tool is done only when it satisfies the Definition of Done in section 9 and its own spec.
6. **Strict quality gates.** TypeScript strict mode, lint, typecheck, tests, and static production build must pass before a release is considered verified.
7. **Static export only.** GitHub Pages deployment uses `output: "export"`; no server actions, route handlers, middleware/proxy dependency, ISR, or runtime database may be required.
8. **Financial safety.** FinPlan is a planning/educational toolkit, not personalized financial, investment, tax, or insurance advice. Assumptions must remain visible and configurable where relevant.
9. **1.0 scope freeze.** Once the roadmap below is complete, do not add tools to 1.0. Capture later ideas in `docs/POST-1.0-BACKLOG.md`.

## 3. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn-style primitives |
| State | Zustand + persist |
| Browser data | localStorage; IndexedDB deferred per `docs/storage-conventions.md` |
| Charts | Recharts |
| i18n | next-intl (`en`, `th`) |
| Tests | Vitest + Testing Library where useful |
| Deploy | GitHub Pages — `https://tanaboonjew.github.io/finplan/` |
| Production shape | Static export with `basePath: "/finplan"` |

## 4. Repository layout

```text
finplan/
├── MASTER-PLAN.md                 # roadmap/status SSOT
├── README.md                      # public product/development guide
├── docs/
│   ├── specs/<tool>.md            # one spec per tool
│   ├── screenshots/               # release screenshots
│   ├── storage-conventions.md
│   └── POST-1.0-BACKLOG.md        # deliberately deferred work
├── public/                        # static/PWA/OG assets
├── src/
│   ├── app/[locale]/              # statically generated EN/TH routes
│   ├── components/
│   │   ├── hub/
│   │   ├── shared/
│   │   ├── tools/
│   │   └── ui/
│   ├── lib/
│   │   ├── finance/               # pure finance/domain logic
│   │   ├── storage/               # versioned local stores/import validation
│   │   └── demo/                  # deterministic demo seeds
│   └── messages/
│       ├── en.json
│       └── th.json
└── tests/
```

## 5. Design system and product behavior

- Light/dark themes use semantic CSS variables.
- Emerald/green is the primary growth-oriented accent; neutral surfaces remain restrained.
- Numeric output uses tabular figures where useful.
- Mobile-first layouts must remain usable at 375px.
- Keyboard users receive visible focus states; motion respects reduced-motion preferences.
- Empty, invalid, and malformed-import states must fail safely and explain the next action.
- Demo seeds must use fictional data and must not imply personalized recommendations.

## 6. Tools and build order

All routes below are canonical route slugs without locale prefixes. `/pay` is the canonical route for the **Subscriptions tracker**; there is no separate `/subscriptions` route.

| # | Route | Tool | MVP / release scope | 1.0 status |
|---:|---|---|---|---|
| 0 | `/` | Hub landing | Hero, stats, categories, full tool grid | DONE |
| 1 | `/debt` | Debt payoff planner | Snowball, avalanche, hybrid, schedules, extra-payment simulation | DONE |
| 2 | `/budget` | Yearly budget | Categories x 12 months, plan vs actual, health/rollover behavior | DONE |
| 3 | `/retirement` | Retirement planner | Savings/growth projection, FIRE target, scenarios | DONE |
| 4 | `/jar` | Six Jars manager | Allocations, distributions, balances, custom jars/transfers | DONE |
| 5 | `/loan` | Loan explainer | Amortization, principal/interest visualization, refinance break-even | DONE |
| 6 | `/tax` | Tax planner | Configurable progressive brackets, deductions, take-home analysis | DONE |
| 7 | `/timeline` | Life goals timeline | Goals, cash overlap, timeline visualization, conflict detection | DONE |
| 8 | `/pay` | Subscriptions tracker | Monthly/annual subscriptions, renewals, price history | DONE |
| 9 | `/dca` | DCA fee comparator | Fund/broker fee drag, compounding comparison, break-even horizon | DONE |
| 10 | `/flow` | Cash flow planner | Income/expense streams, monthly view, what-if recomputation | DONE |
| 11 | `/credit-card` | Credit card comparison | Card/spend inputs, fee/reward value, spend-based ranking | DONE |
| 12 | `/travel-card` | Travel card comparator | FX/reward assumptions and trip-cost comparison | DONE |
| 13 | `/insurance` | Insurance manager | Policies, per-member coverage summary, coverage-gap checklist | DONE |
| 14 | `/strategy` | Investment strategy board | Thesis/scenario/risk board and markdown export | DONE |
| 15 | `/kingdom` | Gamified budget kingdom | Budget-category buildings, progress/achievements | DONE |
| 16 | `/wake-up` | Readiness quiz | Ten-question scoring and action-oriented tips | DONE |
| 17 | `/portfolio-analyzer` | Portfolio analyzer | Paste CSV/table, allocation, concentration, drift indicators | DONE |
| 18 | `/statement` | Statement parser | **CSV-first** import, column detection, categorization, rules | DONE |

`moodeng`, `kilocash`, `pipe-cleaner`, and other unrelated extras are out of scope.

### Statement parsing boundary

1.0 is intentionally CSV-first. The implementation may accept pasted CSV/table-like data as defined by the statement spec, but it must not pretend to parse PDFs. PDF/OCR statement extraction is deferred post-1.0 work and requires an explicit roadmap decision before implementation.

## 7. Phases

- **Phase 0 — Scaffold:** project shell, design system, hub, i18n wiring, dark mode, static deployment pipeline. DONE
- **Phase 1 — Foundations:** shared finance/domain library, shared UI primitives, storage conventions, foundational tests. DONE
- **Phases 2–19 — Tool delivery:** one tool per phase in table order; spec first, then domain/storage/UI/i18n/demo/tests. DONE
- **Phase 20 — Release polish:** accessibility/focus/reduced motion, 375px audit, SEO metadata, OG asset, PWA/offline behavior, README screenshots, architecture/development docs, import-safety review, performance review. DONE in the 1.0 release-candidate commit; final release still requires the quality gates to execute successfully.

## 8. Working protocol

For roadmap work:

1. Read this file first.
2. Read the relevant `docs/specs/<tool>.md` before changing a tool.
3. Treat merged code and tests as authoritative when they are newer and consistent with the spec.
4. Resolve remaining ambiguity with the smallest conservative decision and document it.
5. Do not silently expand scope.
6. Run lint, typecheck, full tests, and static production build before calling a release verified.

## 9. Definition of Done

A tool is **DONE** only when all applicable items are satisfied:

- [x] A repository spec exists and describes the shipped behavior.
- [x] The locale-prefixed route statically renders.
- [x] Desktop and 375px-class mobile layouts are usable.
- [x] Light and dark themes are supported.
- [x] User inputs are validated and error/empty states are safe.
- [x] Reusable finance/domain calculations live in `src/lib/finance/` with edge-case tests where applicable.
- [x] Relevant state persists locally with a versioned store.
- [x] Non-trivial inputs have deterministic demo data.
- [x] JSON export/import is implemented where appropriate and validates imported data.
- [x] User-facing copy is available in English and Thai.
- [x] Client-only charts/components preserve static-export compatibility.
- [x] Route/spec/tool-registry consistency is covered by tests.
- [x] The release quality gate is lint + typecheck + full tests + `next build` static export.

The checklist above records the implemented 1.0 contract. A particular release commit is not considered **verified** until its CI/build gate has actually completed successfully.

## 10. Release freeze

The existing roadmap is complete. From this point forward, 1.0 work is stabilization: correctness fixes, accessibility fixes, documentation, dependency/security maintenance, performance improvements, and regressions. New finance tools belong in a separately approved post-1.0 roadmap, not this release.

See `docs/POST-1.0-BACKLOG.md` for deferred work.
