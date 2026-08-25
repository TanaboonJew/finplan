"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";
import {
  READINESS_QUESTIONS,
  answeredCount,
  isQuizComplete,
  maxTotalScore,
} from "@/lib/finance/readiness";
import { useWakeUpStore } from "@/lib/storage/wake-up-store";
import { useMounted } from "./use-mounted";
import { WakeUpToolbar } from "./wake-up-toolbar";
import { QuizForm, ResultsPanel } from "./quiz-form";

export function WakeUpTool() {
  const t = useTranslations("wake-up");
  const mounted = useMounted();

  const answers = useWakeUpStore((state) => state.answers);

  const answered = useMemo(() => answeredCount(answers), [answers]);
  const complete = useMemo(() => isQuizComplete(answers), [answers]);

  if (!mounted) {
    return (
      <div
        className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10"
        aria-busy="true"
      >
        <span className="sr-only">{t("loading")}</span>
        <div className="flex animate-pulse flex-col gap-4">
          <div className="h-9 w-64 rounded-md bg-muted" />
          <div className="h-24 rounded-lg bg-muted" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <WakeUpToolbar />
      </header>

      {!complete && (
        <>
          <div
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
            role="status"
          >
            <ClipboardList
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t("intro.title")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("intro.description", { max: maxTotalScore() })}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-semibold tabular-nums">
              {t("progress.count", {
                answered,
                total: READINESS_QUESTIONS.length,
              })}
            </span>
          </div>

          {answered > 0 && (
            <p aria-live="polite" className="sr-only">
              {t("progress.count", {
                answered,
                total: READINESS_QUESTIONS.length,
              })}
            </p>
          )}
        </>
      )}

      {complete ? <ResultsPanel /> : <QuizForm />}
    </div>
  );
}
