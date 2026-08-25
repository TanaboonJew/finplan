"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStrategyStore } from "@/lib/storage/strategy-store";
import {
  exportBoardAsMarkdown,
  type Thesis,
  type ThesisStatus,
} from "@/lib/finance/strategy";
import { useMounted } from "./use-mounted";
import { StrategyToolbar, downloadMarkdown } from "./strategy-toolbar";
import { StrategyStats } from "./strategy-stats";
import { KanbanColumn } from "./strategy-board";
import { ThesisEditor, AddThesisForm } from "./thesis-editor";

export function StrategyTool() {
  const t = useTranslations("strategy");
  const tBoard = useTranslations("strategy.board");
  const mounted = useMounted();

  const theses = useStrategyStore((state) => state.theses);

  const [editingThesis, setEditingThesis] = useState<Thesis | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const grouped = useMemo(() => {
    const groups: Record<ThesisStatus, Thesis[]> = {
      idea: [],
      active: [],
      closed: [],
    };
    for (const thesis of theses) {
      groups[thesis.status].push(thesis);
    }
    return groups;
  }, [theses]);

  function handleExportMarkdown() {
    const md = exportBoardAsMarkdown(theses, {
      boardTitle: t("boardTitle"),
      generatedAt: `${t("generatedAt")} ${new Date().toLocaleDateString()}`,
      statusIdea: tBoard("colIdea"),
      statusActive: tBoard("colActive"),
      statusClosed: tBoard("colClosed"),
      scenariosLabel: t("editor.scenarios"),
      risksLabel: t("editor.risks"),
      noContent: tBoard("emptyColumn"),
      scenarioHeaders: [
        t("editor.outcome"),
        t("editor.probability"),
        t("editor.return"),
        t("editor.horizon"),
        t("editor.notes"),
      ],
      riskHeaders: [
        t("editor.riskName"),
        t("editor.level"),
        t("editor.mitigation"),
      ],
      returnLabel: t("editor.return"),
      horizonLabel: t("editor.horizon"),
      probabilityLabel: t("editor.probability"),
      levelLabel: t("editor.level"),
      mitigationLabel: t("editor.mitigation"),
      notesLabel: t("editor.notes"),
    });
    downloadMarkdown(
      `finplan-strategy-${new Date().toISOString().slice(0, 10)}.md`,
      md
    );
  }

  if (!mounted) {
    return (
      <div
        className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10"
        aria-busy="true"
      >
        <span className="sr-only">{t("loading")}</span>
        <div className="flex animate-pulse flex-col gap-6">
          <div className="h-9 w-64 rounded-md bg-muted" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
          </div>
          <div className="flex gap-4">
            <div className="h-64 flex-1 rounded-lg bg-muted" />
            <div className="h-64 flex-1 rounded-lg bg-muted" />
            <div className="h-64 flex-1 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <StrategyToolbar onExportMarkdown={handleExportMarkdown} />
      </header>

      <StrategyStats theses={theses} />

      <div>
        {showAddForm ? (
          <AddThesisForm onDone={() => setShowAddForm(false)} />
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="size-4" aria-hidden />
            {t("addThesis")}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <KanbanColumn
          status="idea"
          theses={grouped.idea}
          onCardClick={setEditingThesis}
        />
        <KanbanColumn
          status="active"
          theses={grouped.active}
          onCardClick={setEditingThesis}
        />
        <KanbanColumn
          status="closed"
          theses={grouped.closed}
          onCardClick={setEditingThesis}
        />
      </div>

      {editingThesis && (
        <ThesisEditor
          key={editingThesis.id}
          thesis={editingThesis}
          onClose={() => setEditingThesis(null)}
        />
      )}
    </div>
  );
}
