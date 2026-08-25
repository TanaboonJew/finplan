"use client";

import { useTranslations } from "next-intl";
import { Lightbulb } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import type { ReadinessLevelId } from "@/lib/finance/readiness";
import {
  READINESS_QUESTIONS,
  maxTotalScore,
  readinessLevel,
  totalScore,
  weakQuestionIds,
} from "@/lib/finance/readiness";
import { useWakeUpStore } from "@/lib/storage/wake-up-store";

const LEVEL_TONE: Record<ReadinessLevelId, string> = {
  "getting-started": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  building: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  "on-track": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
};

export function ResultsPanel() {
  const t = useTranslations("wake-up");
  const answers = useWakeUpStore((state) => state.answers);

  const score = totalScore(answers);
  const max = maxTotalScore();
  const level = readinessLevel(score);
  const weak = weakQuestionIds(answers);
  const percent = Math.round((score / max) * 100);

  function handleRetake() {
    if (!window.confirm(t("results.retakeConfirm"))) return;
    useWakeUpStore.getState().reset();
  }

  return (
    <section aria-label={t("results.title")} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label={t("results.scoreLabel")}
          value={`${score} / ${max}`}
          sublabel={`${percent}%`}
        />
        <StatCard
          label={t("results.levelLabel")}
          value={
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${LEVEL_TONE[level.id]}`}
            >
              {t(`results.levels.${level.id}`)}
            </span>
          }
          sublabel={t("results.levelHint")}
        />
      </div>

      <div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={t("results.scoreLabel")}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {t("results.scoreLabel")}: {score} / {max}
      </p>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="size-4 text-amber-500" aria-hidden />
          {t("results.tipsTitle")}
        </h3>
        {weak.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("results.noTips")}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {weak.map((questionId) => (
              <li key={questionId} className="text-sm">
                <span className="font-medium">
                  {t(`questions.${questionId}.label`)}
                </span>
                <span className="mt-0.5 block text-muted-foreground">
                  {t(`questions.${questionId}.tip`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Button type="button" variant="outline" onClick={handleRetake}>
          {t("results.retake")}
        </Button>
      </div>
    </section>
  );
}

export function QuizForm() {
  const t = useTranslations("wake-up");
  const answers = useWakeUpStore((state) => state.answers);

  return (
    <div className="flex flex-col gap-4">
      {READINESS_QUESTIONS.map((question, index) => (
        <fieldset
          key={question.id}
          className="rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <legend className="px-1 text-sm font-semibold">
            {index + 1}. {t(`questions.${question.id}.label`)}
          </legend>
          <div className="mt-1 flex flex-col gap-2">
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                htmlFor={`wake-up-${question.id}-${option.id}`}
              >
                <input
                  type="radio"
                  id={`wake-up-${question.id}-${option.id}`}
                  name={`wake-up-${question.id}`}
                  value={option.id}
                  checked={answers[question.id] === option.id}
                  onChange={() =>
                    useWakeUpStore.getState().setAnswer(question.id, option.id)
                  }
                  className="size-4 accent-emerald-600"
                />
                <span>{t(`questions.${question.id}.options.${option.id}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
