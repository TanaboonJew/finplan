# Spec — Readiness quiz (`/wake-up`)

Phase 16 — MASTER-PLAN section 6 row 16. A 10-question scored checklist with
personalized action tips per answer.

## 1. Purpose

Give the user a quick, honest snapshot of their personal-finance readiness.
They answer ten yes/no-style questions across core money topics; the tool
scores the answers into a readiness level and surfaces concrete action tips
for every weak answer. It is a checklist, not a test — no data leaves the
device, and answers can be retaken at any time.

## 2. Data model

Answers are stored as a map from question id to option id.

```ts
interface QuizOption {
  id: string;      // "a" | "b" | "c" | "d"
  score: number;   // integer 0..3
}

interface QuizQuestion {
  id: string;          // "q1".."q10"
  options: readonly QuizOption[];
}

interface WakeUpToolPersisted {
  answers: Record<string, string>; // questionId -> optionId
  completedAt: string | null;      // ISO timestamp when quiz was finished
}
```

Questions are defined in `src/lib/finance/readiness.ts` as
`READINESS_QUESTIONS` (10 questions, each with 4 options whose scores run
3/2/1/0 from best to worst). The question/option/tip *text* lives in i18n
under `wake-up.questions.<qid>.*`; only ids and scores live in code.

Topics covered (one question each): emergency fund, monthly budget,
spending awareness, savings rate, debt management, retirement savings,
insurance coverage, goal setting, financial automation, credit health.

## 3. Pure math — `src/lib/finance/readiness.ts`

All pure, no React, Vitest-covered.

```ts
function optionScore(questionId: string, optionId: unknown): number;
// Score of the chosen option; 0 for unknown question/option or missing answer.

function maxTotalScore(): number;
// Sum of the best option score per question (currently 30).

function totalScore(answers: Record<string, string>): number;
// Sum of optionScore over all questions.

function readinessLevel(score: number): {
  id: "getting-started" | "building" | "on-track" | "ready";
  min: number; // inclusive lower bound of the band
};
// Bands over the achievable range:
//   getting-started: 0 ..< 25% of max
//   building:        25% ..< 60%
//   on-track:        60% ..< 85%
//   ready:           >= 85%
// Negative scores are clamped to the lowest band.

function weakQuestionIds(answers: Record<string, string>): string[];
// Question ids whose chosen score is <= 1 (or unanswered), in question order.
```

Edge cases covered by tests: empty answers → score 0 + weakest band;
unknown ids → 0; band boundaries at exactly 25%/60%/85%; clamping.

## 4. Store — `src/lib/storage/wake-up-store.ts`

- Zustand + `persist`, key `finplan:wake-up:v1`, `version: 1`.
- Actions: `setAnswer(questionId, optionId)`, `markCompleted()`,
  `replaceAll(data)`, `reset()`.
- `setAnswer` ignores unknown questions/options so persisted state can never
  hold invalid pairs.
- Export schema version constant: `WAKE_UP_EXPORT_SCHEMA_VERSION = 1`.
- `parseWakeUpToolState(value: unknown): WakeUpToolPersisted` sanitizer that
  drops unknown/invalid entries instead of throwing (a quiz import must be
  forgiving; anything unparseable becomes an empty quiz).

## 5. UI layout

Single page, mobile-first, max-w ~3xl:

1. **Toolbar** — SeedDemoButton, ExportImportButtons, reset.
2. **Intro card** (when quiz not completed) — explainer + progress indicator
   ("x / 10 answered").
3. **Question list** — one card per question: `<fieldset>` + `<legend>` with
   the question text, radio inputs (name = question id) for the four options.
4. **Results panel** (shown once all 10 are answered) — readiness level badge,
   score `x / 30`, progress bar, personalized action tips for each weak
   question ("question label → tip"), and a "retake" button that clears
   answers.
5. **Empty state** — n/a (quiz starts empty); hydration skeleton until
   `mounted`.

Validation: options are radios so a selection is always valid; results only
appear when every question has an answer; store rejects unknown pairs.

Accessibility: fieldset/legend grouping, visible focus rings from the shared
input classes, keyboard-navigable radios, `aria-live="polite"` on the score.

## 6. Demo seed — `src/lib/demo/wake-up.ts`

Returns a filled quiz with a realistic mixed profile (mostly good answers,
two weak ones) plus `completedAt`. Must produce an "on-track" result.

## 7. Export / import

JSON envelope via `createExportEnvelope("wake-up", 1, data)`; filename
`finplan-wake-up-YYYY-MM-DD.json`. Import validates
`readExportEnvelope(value, "wake-up")` + schemaVersion === 1, then sanitizes
via `parseWakeUpToolState` and replaces state wholesale.

## 8. i18n

All strings under top-level `"wake-up"` namespace in `en.json` / `th.json`.
Keys: title, subtitle, loading, intro.*, progress.*, questions.q1..q10
(label, options.a..d.label, tips for scores 0/1), results.* (level names,
score label, tips heading, retake), toolbar.* (reset/resetConfirm/importInvalid).

## 9. Tests

- Finance: optionScore/maxTotalScore/totalScore math, readinessLevel band
  boundaries, weakQuestionIds ordering, empty/unknown-answer edge cases.
- Store: setAnswer validation, markCompleted, replaceAll/reset, persistence.
- Seed: valid against parser, produces on-track level, all questions answered.

## 10. Out of scope

Accounts/sync, adaptive question ordering, scoring weights per topic,
comparison against other users, PDF report export.
