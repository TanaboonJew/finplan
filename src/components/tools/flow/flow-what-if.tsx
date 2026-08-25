"use client";

import { useTranslations } from "next-intl";
import type { FlowStream, WhatIfAdjustment } from "@/lib/finance/flow";

interface FlowWhatIfProps {
  streams: FlowStream[];
  adjustments: WhatIfAdjustment[];
  onAdjustmentsChange: (adjustments: WhatIfAdjustment[]) => void;
}

export function FlowWhatIf({
  streams,
  adjustments,
  onAdjustmentsChange,
}: FlowWhatIfProps) {
  const t = useTranslations("flow");

  if (streams.length === 0) return null;

  function getScale(streamId: string): number {
    return adjustments.find((a) => a.streamId === streamId)?.scale ?? 1;
  }

  function setScale(streamId: string, scale: number) {
    const rounded = Math.round(scale * 100) / 100;
    const existing = adjustments.find((a) => a.streamId === streamId);
    if (rounded === 1) {
      onAdjustmentsChange(adjustments.filter((a) => a.streamId !== streamId));
    } else if (existing) {
      onAdjustmentsChange(
        adjustments.map((a) =>
          a.streamId === streamId ? { ...a, scale: rounded } : a
        )
      );
    } else {
      onAdjustmentsChange([...adjustments, { streamId, scale: rounded }]);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{t("whatIf.title")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("whatIf.description")}
      </p>
      <div className="space-y-3">
        {streams.map((stream) => {
          const scale = getScale(stream.id);
          const percent = Math.round(scale * 100);
          const isModified = scale !== 1;

          return (
            <div
              key={stream.id}
              className="flex items-center gap-4 rounded-md border border-border px-3 py-2"
            >
              <span className="min-w-[120px] truncate text-sm font-medium">
                {stream.name}
              </span>
              <input
                type="range"
                min={50}
                max={200}
                value={percent}
                onChange={(e) => setScale(stream.id, Number(e.target.value) / 100)}
                className="h-2 flex-1 cursor-pointer accent-emerald-600"
              />
              <span
                className={`min-w-[4ch] text-right text-sm tabular-nums ${
                  isModified
                    ? "font-semibold text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }`}
              >
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
