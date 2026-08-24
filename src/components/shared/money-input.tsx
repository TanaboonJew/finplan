"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { parseMoneyInput } from "@/lib/finance/format";

export interface MoneyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number | null;
  onChange: (value: number | null) => void;
  label: React.ReactNode;
  currency?: string;
  hideLabel?: boolean;
}

export function MoneyInput({
  value,
  onChange,
  label,
  currency,
  hideLabel = false,
  className,
  id,
  ...rest
}: MoneyInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  const [lastSeenValue, setLastSeenValue] = useState(value);

  if (value !== lastSeenValue) {
    setLastSeenValue(value);
    if (parseMoneyInput(draft) !== value) {
      setDraft(value === null ? "" : String(value));
    }
  }

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium text-muted-foreground",
          hideLabel && "sr-only"
        )}
      >
        {label}
      </label>
      <div className="relative">
        {currency ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground tabular-nums">
            {currency}
          </span>
        ) : null}
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          data-slot="money-input"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(parseMoneyInput(event.target.value));
          }}
          className={cn(
            "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "tabular-nums disabled:cursor-not-allowed disabled:opacity-50",
            currency && "pl-11"
          )}
          {...rest}
        />
      </div>
    </div>
  );
}
