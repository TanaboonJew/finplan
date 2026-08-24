"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { parseMoneyInput } from "@/lib/finance/format";

export interface PlanCellInputProps {
  value: number;
  onCommit: (value: number | null) => void;
  label: string;
}

export function PlanCellInput({ value, onCommit, label }: PlanCellInputProps) {
  const [draft, setDraft] = useState(value === 0 ? "" : String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(value === 0 ? "" : String(value));
    }
  }, [value]);

  function commit() {
    const parsed = parseMoneyInput(draft);
    if (parsed === null) {
      setDraft(value === 0 ? "" : String(value));
    }
    onCommit(parsed);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      data-slot="plan-cell-input"
      aria-label={label}
      value={draft}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        commit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      onChange={(event) => setDraft(event.target.value)}
      placeholder="—"
      className={cn(
        "w-full rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-right text-xs tabular-nums",
        "placeholder:text-muted-foreground/50",
        "hover:border-input focus-visible:border-input focus-visible:bg-background",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      )}
    />
  );
}
