"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  Risk,
  RiskLevel,
  Scenario,
  ScenarioOutcome,
  Thesis,
  ThesisStatus,
} from "@/lib/finance/strategy";
import { useStrategyStore } from "@/lib/storage/strategy-store";
import { outcomeColorClass } from "./strategy-format";

const STATUSES: ThesisStatus[] = ["idea", "active", "closed"];
const OUTCOMES: ScenarioOutcome[] = ["bull", "base", "bear"];
const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];

interface ThesisEditorProps {
  thesis: Thesis;
  onClose: () => void;
}

export function ThesisEditor({ thesis, onClose }: ThesisEditorProps) {
  const t = useTranslations("strategy.editor");
  const tBoard = useTranslations("strategy.board");
  const store = useStrategyStore();

  const [title, setTitle] = useState(thesis.title);
  const [assetClass, setAssetClass] = useState(thesis.assetClass);
  const [thesisText, setThesisText] = useState(thesis.thesis);
  const [status, setStatus] = useState<ThesisStatus>(thesis.status);
  const [notes, setNotes] = useState(thesis.notes);
  const [scenariosExpanded, setScenariosExpanded] = useState(true);
  const [risksExpanded, setRisksExpanded] = useState(true);

  function handleSave() {
    store.updateThesis(thesis.id, {
      title,
      assetClass,
      thesis: thesisText,
      status,
      notes,
    });
    onClose();
  }

  function handleAddScenario(outcome: ScenarioOutcome) {
    store.addScenario(thesis.id, {
      outcome,
      probability: 0.33,
      expectedReturn: 0,
      timeHorizonMonths: 12,
      notes: "",
    });
  }

  function handleUpdateScenario(
    scenarioId: string,
    patch: Partial<Omit<Scenario, "id">>
  ) {
    store.updateScenario(thesis.id, scenarioId, patch);
  }

  function handleRemoveScenario(scenarioId: string) {
    store.removeScenario(thesis.id, scenarioId);
  }

  function handleAddRisk() {
    store.addRisk(thesis.id, {
      name: "",
      level: "medium",
      mitigation: "",
      notes: "",
    });
  }

  function handleUpdateRisk(
    riskId: string,
    patch: Partial<Omit<Risk, "id">>
  ) {
    store.updateRisk(thesis.id, riskId, patch);
  }

  function handleRemoveRisk(riskId: string) {
    store.removeRisk(thesis.id, riskId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 sm:pt-20">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("editThesis")}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("close")}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("titleLabel")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{t("assetClassLabel")}</label>
              <input
                type="text"
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("statusLabel")}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ThesisStatus)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {tBoard(`col${s.charAt(0).toUpperCase() + s.slice(1)}` as "colIdea" | "colActive" | "colClosed")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("thesisLabel")}</label>
            <textarea
              value={thesisText}
              onChange={(e) => setThesisText(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t("notesLabel")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-md border border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium"
              onClick={() => setScenariosExpanded(!scenariosExpanded)}
            >
              {t("scenarios")} ({thesis.scenarios.length})
              {scenariosExpanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
            {scenariosExpanded && (
              <div className="space-y-3 border-t border-border p-4">
                {thesis.scenarios.map((s) => (
                  <ScenarioRow
                    key={s.id}
                    scenario={s}
                    onUpdate={(patch) => handleUpdateScenario(s.id, patch)}
                    onRemove={() => handleRemoveScenario(s.id)}
                  />
                ))}
                <div className="flex gap-2">
                  {OUTCOMES.filter(
                    (o) => !thesis.scenarios.some((s) => s.outcome === o)
                  ).map((o) => (
                    <Button
                      key={o}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddScenario(o)}
                    >
                      <Plus className="size-3" aria-hidden />
                      {t(`outcomes.${o}`)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium"
              onClick={() => setRisksExpanded(!risksExpanded)}
            >
              {t("risks")} ({thesis.risks.length})
              {risksExpanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
            {risksExpanded && (
              <div className="space-y-3 border-t border-border p-4">
                {thesis.risks.map((r) => (
                  <RiskRow
                    key={r.id}
                    risk={r}
                    onUpdate={(patch) => handleUpdateRisk(r.id, patch)}
                    onRemove={() => handleRemoveRisk(r.id)}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRisk}
                >
                  <Plus className="size-3" aria-hidden />
                  {t("addRisk")}
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 dark:text-red-400"
              onClick={() => {
                if (window.confirm(t("deleteConfirm", { title: thesis.title }))) {
                  store.removeThesis(thesis.id);
                  onClose();
                }
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              {t("delete")}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="button" onClick={handleSave}>
                {t("save")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioRow({
  scenario,
  onUpdate,
  onRemove,
}: {
  scenario: Scenario;
  onUpdate: (patch: Partial<Omit<Scenario, "id">>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("strategy.editor");
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
      <div className="flex-1 min-w-[120px]">
        <label className="mb-1 block text-xs text-muted-foreground">{t("outcome")}</label>
        <Badge className={outcomeColorClass(scenario.outcome)}>
          {t(`outcomes.${scenario.outcome}`)}
        </Badge>
      </div>
      <div className="min-w-[80px]">
        <label className="mb-1 block text-xs text-muted-foreground">{t("probability")}</label>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={scenario.probability}
          onChange={(e) =>
            onUpdate({ probability: Math.max(0, Math.min(1, Number(e.target.value))) })
          }
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </div>
      <div className="min-w-[80px]">
        <label className="mb-1 block text-xs text-muted-foreground">{t("return")}</label>
        <input
          type="number"
          step={0.01}
          value={scenario.expectedReturn}
          onChange={(e) => onUpdate({ expectedReturn: Number(e.target.value) })}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </div>
      <div className="min-w-[80px]">
        <label className="mb-1 block text-xs text-muted-foreground">{t("horizon")}</label>
        <input
          type="number"
          min={1}
          value={scenario.timeHorizonMonths}
          onChange={(e) =>
            onUpdate({ timeHorizonMonths: Math.max(1, Number(e.target.value)) })
          }
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </div>
      <div className="flex-1 min-w-[150px]">
        <label className="mb-1 block text-xs text-muted-foreground">{t("notes")}</label>
        <input
          type="text"
          value={scenario.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="size-3" aria-hidden />
      </Button>
    </div>
  );
}

function RiskRow({
  risk,
  onUpdate,
  onRemove,
}: {
  risk: Risk;
  onUpdate: (patch: Partial<Omit<Risk, "id">>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("strategy.editor");
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
      <div className="flex-1 min-w-[150px]">
        <label className="mb-1 block text-xs text-muted-foreground">{t("riskName")}</label>
        <input
          type="text"
          value={risk.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </div>
      <div className="min-w-[100px]">
        <label className="mb-1 block text-xs text-muted-foreground">{t("level")}</label>
        <select
          value={risk.level}
          onChange={(e) => onUpdate({ level: e.target.value as RiskLevel })}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
        >
          {RISK_LEVELS.map((l) => (
            <option key={l} value={l}>
              {t(`levels.${l}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[150px]">
        <label className="mb-1 block text-xs text-muted-foreground">{t("mitigation")}</label>
        <input
          type="text"
          value={risk.mitigation}
          onChange={(e) => onUpdate({ mitigation: e.target.value })}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="size-3" aria-hidden />
      </Button>
    </div>
  );
}

export function AddThesisForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations("strategy.editor");
  const store = useStrategyStore();
  const [title, setTitle] = useState("");
  const [assetClass, setAssetClass] = useState("");

  function handleAdd() {
    if (!title.trim()) return;
    store.addThesis({
      title: title.trim(),
      assetClass: assetClass.trim() || "General",
      thesis: "",
      status: "idea",
      scenarios: [],
      risks: [],
      notes: "",
    });
    onDone();
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border bg-card p-4">
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1 block text-sm font-medium">{t("titleLabel")}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          autoFocus
        />
      </div>
      <div className="min-w-[150px]">
        <label className="mb-1 block text-sm font-medium">{t("assetClassLabel")}</label>
        <input
          type="text"
          value={assetClass}
          onChange={(e) => setAssetClass(e.target.value)}
          placeholder={t("assetClassPlaceholder")}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <Button type="button" onClick={handleAdd} disabled={!title.trim()}>
        {t("addThesis")}
      </Button>
      <Button type="button" variant="ghost" onClick={onDone}>
        {t("cancel")}
      </Button>
    </div>
  );
}
