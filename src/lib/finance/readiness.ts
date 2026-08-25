export type ReadinessLevelId =
  | "getting-started"
  | "building"
  | "on-track"
  | "ready";

export interface QuizOption {
  id: string;
  score: number;
}

export interface QuizQuestion {
  id: string;
  options: readonly QuizOption[];
}

const STANDARD_OPTIONS: readonly QuizOption[] = [
  { id: "a", score: 3 },
  { id: "b", score: 2 },
  { id: "c", score: 1 },
  { id: "d", score: 0 },
];

/**
 * Ten readiness questions. Option scores run best (3) to worst (0).
 * Text lives in i18n under `wake-up.questions.<qid>.*`.
 */
export const READINESS_QUESTIONS: readonly QuizQuestion[] = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
].map((id) => ({ id, options: STANDARD_OPTIONS }));

const QUESTION_INDEX = new Map(
  READINESS_QUESTIONS.map((question, index) => [question.id, index])
);

export function optionScore(questionId: string, optionId: unknown): number {
  const question = READINESS_QUESTIONS.find((q) => q.id === questionId);
  if (!question || typeof optionId !== "string") return 0;
  const option = question.options.find((o) => o.id === optionId);
  return option ? option.score : 0;
}

export function maxTotalScore(): number {
  return READINESS_QUESTIONS.reduce(
    (sum, question) =>
      sum + Math.max(...question.options.map((option) => option.score)),
    0
  );
}

export function totalScore(answers: Record<string, string>): number {
  return READINESS_QUESTIONS.reduce(
    (sum, question) => sum + optionScore(question.id, answers[question.id]),
    0
  );
}

const BANDS: readonly { threshold: number; id: ReadinessLevelId }[] = [
  { threshold: 0.85, id: "ready" },
  { threshold: 0.6, id: "on-track" },
  { threshold: 0.25, id: "building" },
  { threshold: -Infinity, id: "getting-started" },
];

export function readinessLevel(score: number): {
  id: ReadinessLevelId;
  min: number;
} {
  if (!Number.isFinite(score)) {
    return { id: "getting-started", min: 0 };
  }
  const max = maxTotalScore();
  const clamped = Math.min(max, Math.max(0, score));
  const ratio = max === 0 ? 0 : clamped / max;
  for (const band of BANDS) {
    if (ratio >= band.threshold) {
      return { id: band.id, min: Math.ceil(band.threshold * max) };
    }
  }
  return { id: "getting-started", min: 0 };
}

export function weakQuestionIds(answers: Record<string, string>): string[] {
  return READINESS_QUESTIONS.filter(
    (question) => optionScore(question.id, answers[question.id]) <= 1
  ).map((question) => question.id);
}

export function isQuizComplete(answers: Record<string, string>): boolean {
  return READINESS_QUESTIONS.every((question) =>
    question.options.some((option) => option.id === answers[question.id])
  );
}

export function answeredCount(answers: Record<string, string>): number {
  return READINESS_QUESTIONS.reduce((count, question) => {
    const chosen = answers[question.id];
    const valid =
      typeof chosen === "string" &&
      question.options.some((option) => option.id === chosen);
    return count + (valid ? 1 : 0);
  }, 0);
}

export { QUESTION_INDEX };
