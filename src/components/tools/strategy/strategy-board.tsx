"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { Thesis, ThesisStatus } from "@/lib/finance/strategy";
import { summarizeThesis } from "@/lib/finance/strategy";
import { formatPercent, outcomeColorClass, statusColorClass } from "./strategy-format";

interface ThesisCardProps {
  thesis: Thesis;
  onClick: () => void;
}

export function ThesisCard({ thesis, onClick }: ThesisCardProps) {
  const t = useTranslations("strategy.board");
  const tEditor = useTranslations("strategy.editor");
  const summary = summarizeThesis(thesis);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">{thesis.title}</h3>
        {summary.highRiskCount > 0 && (
          <AlertTriangle className="size-4 shrink-0 text-red-500" aria-label={t("highRisk")} />
        )}
      </div>

      <Badge
        variant="secondary"
        className={`mb-2 text-xs ${statusColorClass(thesis.status)}`}
      >
        {t(`col${thesis.status.charAt(0).toUpperCase() + thesis.status.slice(1)}` as "colIdea" | "colActive" | "colClosed")}
      </Badge>

      {thesis.assetClass && (
        <p className="mb-2 text-xs text-muted-foreground">{thesis.assetClass}</p>
      )}

      {thesis.scenarios.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {thesis.scenarios.map((s) => (
            <span
              key={s.id}
              className={`text-xs font-medium ${outcomeColorClass(s.outcome)}`}
            >
              {tEditor(`outcomes.${s.outcome}`)}: {formatPercent(s.expectedReturn)}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {t("scenariosCount", { count: summary.scenarioCount })}
        </span>
        <span>·</span>
        <span className={summary.highRiskCount > 0 ? "text-red-500 font-medium" : ""}>
          {t("risksCount", { count: summary.riskCount })}
        </span>
        {summary.weightedReturn !== 0 && (
          <>
            <span>·</span>
            <span className="font-medium">
              {formatPercent(summary.weightedReturn)}
            </span>
          </>
        )}
      </div>
    </button>
  );
}

interface KanbanColumnProps {
  status: ThesisStatus;
  theses: Thesis[];
  onCardClick: (thesis: Thesis) => void;
}

const COLUMN_STYLES: Record<ThesisStatus, string> = {
  idea: "border-t-blue-400 dark:border-t-blue-500",
  active: "border-t-emerald-400 dark:border-t-emerald-500",
  closed: "border-t-zinc-400 dark:border-t-zinc-500",
};

export function KanbanColumn({ status, theses, onCardClick }: KanbanColumnProps) {
  const t = useTranslations("strategy.board");
  const labelKey = `col${status.charAt(0).toUpperCase() + status.slice(1)}` as "colIdea" | "colActive" | "colClosed";

  return (
    <div
      className={`flex flex-1 flex-col rounded-lg border border-border border-t-2 bg-muted/30 p-3 ${COLUMN_STYLES[status]}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t(labelKey)}</h2>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {theses.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {theses.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {t("emptyColumn")}
          </p>
        )}
        {theses.map((thesis) => (
          <ThesisCard
            key={thesis.id}
            thesis={thesis}
            onClick={() => onCardClick(thesis)}
          />
        ))}
      </div>
    </div>
  );
}
