"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import {
  fractionToPercentText,
  percentToFraction,
} from "@/components/tools/loan/loan-format";

export interface PercentInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number | null;
  onChange: (value: number | null) => void;
  label: React.ReactNode;
  error?: React.ReactNode;
}

export function PercentInput({
  value,
  onChange,
  label,
  error,
  className,
  id,
  ...rest
}: PercentInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [draft, setDraft] = useState(
    value === null ? "" : fractionToPercentText(value)
  );
  const [lastSeenValue, setLastSeenValue] = useState(value);

  if (value !== lastSeenValue) {
    setLastSeenValue(value);
    if (percentToFraction(draft) !== value) {
      setDraft(value === null ? "" : fractionToPercentText(value));
    }
  }

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          data-slot="percent-input"
          aria-invalid={error ? true : undefined}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(percentToFraction(event.target.value));
          }}
          className={cn(
            "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-7 text-sm shadow-sm transition-colors tabular-nums",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 dark:border-red-400"
          )}
          {...rest}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          %
        </span>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
