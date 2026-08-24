"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { parseMoneyInput } from "@/lib/finance/format";

const inputClasses = cn(
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

function FieldShell({
  id,
  label,
  error,
  suffix,
  children,
  className,
}: {
  id: string;
  label: React.ReactNode;
  error?: React.ReactNode;
  suffix?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        {children}
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: React.ReactNode;
  error?: React.ReactNode;
  min?: number;
  max?: number;
  className?: string;
}

export function NumberField({
  value,
  onChange,
  label,
  error,
  className,
  ...rest
}: NumberFieldProps) {
  const generatedId = useId();
  const inputId = generatedId;
  const [draft, setDraft] = useState(String(value));
  const [lastSeenValue, setLastSeenValue] = useState(value);

  if (value !== lastSeenValue) {
    setLastSeenValue(value);
    if (parseMoneyInput(draft) !== value) {
      setDraft(String(value));
    }
  }

  return (
    <FieldShell
      id={inputId}
      label={label}
      error={error}
      className={className}
    >
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        data-slot="number-field"
        aria-invalid={error ? true : undefined}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          const parsed = parseMoneyInput(event.target.value);
          if (parsed !== null) onChange(parsed);
        }}
        className={cn(inputClasses, error && "border-red-500 dark:border-red-400")}
        {...rest}
      />
    </FieldShell>
  );
}

export interface PercentFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
}

export function percentToFraction(text: string): number | null {
  if (typeof text !== "string" || text.trim().length === 0) return null;
  const cleaned = text.replace(/[\s,'%\u00A0]/g, "");
  if (cleaned.length === 0) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return parsed / 100;
}

export function fractionToPercentText(fraction: number): string {
  return String(Number((fraction * 100).toPrecision(12)));
}

export function PercentField({
  value,
  onChange,
  label,
  error,
  className,
}: PercentFieldProps) {
  const generatedId = useId();
  const inputId = generatedId;
  const percentText = fractionToPercentText(value);
  const [draft, setDraft] = useState(percentText);
  const [lastSeenValue, setLastSeenValue] = useState(value);

  if (value !== lastSeenValue) {
    setLastSeenValue(value);
    if (percentToFraction(draft) !== value) {
      setDraft(percentText);
    }
  }

  return (
    <FieldShell
      id={inputId}
      label={label}
      error={error}
      suffix="%"
      className={className}
    >
      <input
        id={inputId}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        data-slot="percent-field"
        aria-invalid={error ? true : undefined}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          const parsed = percentToFraction(event.target.value);
          if (parsed !== null) onChange(parsed);
        }}
        className={cn(
          inputClasses,
          "pr-7 tabular-nums",
          error && "border-red-500 dark:border-red-400"
        )}
      />
    </FieldShell>
  );
}
