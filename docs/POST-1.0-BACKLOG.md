# FinPlan Post-1.0 Backlog

This file is intentionally **not** part of the FinPlan 1.0 roadmap. The 1.0 toolset is frozen at the 18 tools listed in `MASTER-PLAN.md`.

Items here may improve reliability or extend an existing capability after 1.0, but none should be treated as a release requirement unless the master plan is explicitly reopened.

## Stabilization and quality

- Add automated Lighthouse/accessibility checks once a stable CI approach is chosen for the static GitHub Pages build.
- Add a lightweight visual-regression workflow around the curated desktop and 375px screenshots.
- Define explicit performance budgets for route JavaScript and large static assets, then enforce them in CI.
- Periodically review PWA cache-version behavior and browser compatibility as Next.js/deployment behavior changes.
- Expand edge-case regression coverage when real bugs are found; prefer narrow tests over snapshot churn.

## Existing-capability improvements

- Consider optional cross-tool data handoff only where it reduces duplicate entry without creating a hidden global financial profile.
- Revisit IndexedDB only if measured statement/import sizes make versioned localStorage materially inadequate.
- Consider additional locale/currency presentation support only after assumptions and formatting rules are specified.
- Consider PDF/OCR statement extraction only through a new approved spec. The 1.0 statement tool remains CSV-first; do not simulate or label CSV/text parsing as PDF support.

## Explicitly not a backlog shortcut

Do not add new calculators, trackers, comparison tools, or investment features here merely because they are easy to build. New finance tools require a separately approved post-1.0 roadmap. Stabilization takes priority.
