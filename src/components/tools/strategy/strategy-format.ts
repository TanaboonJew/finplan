import type { RiskLevel, ScenarioOutcome, ThesisStatus } from "@/lib/finance/strategy";

const STATUS_COLORS: Record<ThesisStatus, string> = {
  idea: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  closed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const OUTCOME_COLORS: Record<ScenarioOutcome, string> = {
  bull: "text-emerald-600 dark:text-emerald-400",
  base: "text-amber-600 dark:text-amber-400",
  bear: "text-red-600 dark:text-red-400",
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function statusColorClass(status: ThesisStatus): string {
  return STATUS_COLORS[status];
}

export function outcomeColorClass(outcome: ScenarioOutcome): string {
  return OUTCOME_COLORS[outcome];
}

export function riskColorClass(level: RiskLevel): string {
  return RISK_COLORS[level];
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
