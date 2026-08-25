"use client";

import { useTranslations } from "next-intl";
import { ChartCard } from "@/components/shared/chart-card";
import type { Goal } from "@/lib/storage/timeline-store";

const CATEGORY_COLORS: Record<string, string> = {
  house: "#3b82f6",
  kids: "#f59e0b",
  retirement: "#10b981",
  education: "#a855f7",
  custom: "#71717a",
};

interface GanttChartProps {
  goals: Goal[];
}

export function GanttChart({ goals }: GanttChartProps) {
  const t = useTranslations("timeline.gantt");

  if (goals.length === 0) {
    return (
      <ChartCard title={t("title")} description={t("description")} height={200}>
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      </ChartCard>
    );
  }

  let minAge = Infinity;
  let maxAge = -Infinity;
  for (const goal of goals) {
    if (goal.startAge < minAge) minAge = goal.startAge;
    if (goal.endAge > maxAge) maxAge = goal.endAge;
  }

  const range = Math.max(maxAge - minAge, 1);
  const PADDING_Y = 40;
  const BAR_HEIGHT = 32;
  const BAR_GAP = 8;
  const height = PADDING_Y * 2 + goals.length * (BAR_HEIGHT + BAR_GAP);

  function xPercent(age: number): number {
    return ((age - minAge) / range) * 100;
  }

  return (
    <ChartCard title={t("title")} description={t("description")} height={height}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
        style={{ fontSize: "10px" }}
      >
        {goals.map((goal, i) => {
          const y = PADDING_Y + i * (BAR_HEIGHT + BAR_GAP);
          const x1 = xPercent(goal.startAge);
          const x2 = xPercent(goal.endAge);
          const width = Math.max(x2 - x1, 0.5);
          const color = CATEGORY_COLORS[goal.category] ?? CATEGORY_COLORS.custom;

          return (
            <g key={goal.id}>
              <text
                x="0"
                y={y + BAR_HEIGHT / 2}
                dominantBaseline="middle"
                className="fill-current text-xs"
                style={{ fontSize: "9px" }}
              >
                {goal.name}
              </text>
              <text
                x="0"
                y={y + BAR_HEIGHT / 2 + 12}
                className="fill-current text-muted-foreground"
                style={{ fontSize: "7px" }}
              >
                {goal.startAge}–{goal.endAge}
              </text>
              <rect
                x={`${x1}%`}
                y={y}
                width={`${width}%`}
                height={BAR_HEIGHT}
                rx={4}
                fill={color}
                opacity={0.85}
              />
            </g>
          );
        })}
        {Array.from(
          { length: Math.floor(range / 5) + 1 },
          (_, i) => minAge + i * 5
        ).map((age) => (
          <g key={age}>
            <line
              x1={`${xPercent(age)}%`}
              y1={PADDING_Y - 8}
              x2={`${xPercent(age)}%`}
              y2={height - PADDING_Y + 8}
              stroke="currentColor"
              opacity={0.1}
              strokeDasharray="2 2"
            />
            <text
              x={`${xPercent(age)}%`}
              y={height - 8}
              textAnchor="middle"
              className="fill-current text-muted-foreground"
              style={{ fontSize: "8px" }}
            >
              {age}
            </text>
          </g>
        ))}
      </svg>
    </ChartCard>
  );
}
